export type AuthUser = {
  name: string;
  email: string;
  role: string | null;
  personnelId: number | null;
  missionId: number | null;
} | null;

export type SharedProps = {
  name?: string;
  auth?: { user?: AuthUser };
  errors?: Record<string, string>;
  flash?: { message?: string; type?: string };
};
