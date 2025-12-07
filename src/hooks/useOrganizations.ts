import { useEffect, useRef } from "react";
import { useAuthStore, type UserOrg } from "../stores/authStore";
import { createClient, createAuthTransport } from "../api/client";
import {
  UserOrganizationService,
  OrganizationService,
} from "../api/generated/service_pb";

/**
 * ユーザーの所属組織を取得してstoreにセットするフック
 * 認証済みの場合、マウント時および認証状態変更時に組織を取得する
 */
export function useOrganizations() {
  const { token, user, isAuthenticated, setOrganizations, organizations } =
    useAuthStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // 未認証またはユーザー情報がない場合はスキップ
    if (!isAuthenticated || !token || !user) {
      return;
    }

    // 既にフェッチ済みならスキップ（組織が0件の場合も再取得しない）
    if (fetchedRef.current) {
      return;
    }

    const fetchOrganizations = async () => {
      try {
        fetchedRef.current = true;

        // UserOrganizationServiceで所属組織一覧を取得
        const userOrgClient = createClient(
          UserOrganizationService,
          createAuthTransport(token)
        );
        const userOrgsResponse = await userOrgClient.listUserOrganizationsByUser({
          userId: user.id,
        });

        // 組織IDリストから組織詳細を取得
        const orgIds = userOrgsResponse.userOrganizations.map(
          (uo) => uo.organizationId
        );

        if (orgIds.length === 0) {
          setOrganizations([]);
          return;
        }

        // 各組織の詳細を取得
        const orgClient = createClient(
          OrganizationService,
          createAuthTransport(token)
        );
        const orgs: UserOrg[] = [];

        for (const userOrg of userOrgsResponse.userOrganizations) {
          try {
            const orgResponse = await orgClient.getOrganization({
              id: userOrg.organizationId,
            });
            if (orgResponse.organization) {
              orgs.push({
                id: orgResponse.organization.id,
                name: orgResponse.organization.name,
                role: userOrg.role,
                isDefault: userOrg.isDefault,
              });
            }
          } catch {
            // 個別の組織取得エラーは無視
          }
        }

        setOrganizations(orgs);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
        fetchedRef.current = false; // エラー時は再取得を許可
      }
    };

    fetchOrganizations();
  }, [isAuthenticated, token, user, setOrganizations]);

  // ログアウト時にフェッチ済みフラグをリセット
  useEffect(() => {
    if (!isAuthenticated) {
      fetchedRef.current = false;
    }
  }, [isAuthenticated]);

  return { organizations };
}
