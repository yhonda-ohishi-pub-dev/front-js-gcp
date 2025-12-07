// JWTペイロードの型定義
export interface JwtPayload {
  user_id: string;
  email: string;
  display_name: string;
  is_superadmin: boolean;
  iss: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
}

// Base64URLをUTF-8文字列にデコード
function base64UrlDecode(base64Url: string): string {
  // Base64URLをBase64に変換
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // パディングを追加
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  // バイナリ文字列にデコード
  const binaryString = atob(padded);
  // UTF-8バイト配列に変換
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // UTF-8としてデコード
  return new TextDecoder("utf-8").decode(bytes);
}

// JWTをデコードしてペイロードを取得
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

// トークンが期限切れかどうかをチェック
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}
