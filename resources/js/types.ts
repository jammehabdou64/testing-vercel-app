export type AuthUser = {
  name: string;
  email: string;
} | null;

export type SharedProps = {
  name?: string;
  auth?: { user?: AuthUser };
  errors?: Record<string, string>;
  flash?: { message?: string; type?: string };
};
