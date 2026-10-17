export interface SupabaseConfiguration {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

function primerValor(...valores: Array<string | undefined>): string | undefined {
  return valores.find((valor) => typeof valor === 'string' && valor.length > 0);
}

export function obtenerConfiguracionSupabase(): SupabaseConfiguration | null {
  const url = primerValor(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.PRICEVERIFY_SUPABASE_URL,
    process.env.NEXT_PUBLIC_PRICEVERIFY_SUPABASE_URL,
    process.env.NEXT_PUBLIC_PRICEVERIFYSUPABASE_URL,
    process.env.NEXT_PUBLIC_PRICEVERIFY_PRICEVERIFYSUPABASE_URL,
  );
  const anonKey = primerValor(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.PRICEVERIFY_SUPABASE_ANON_KEY,
    process.env.PRICEVERIFY_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_PRICEVERIFY_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_PRICEVERIFY_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_PRICEVERIFYSUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_PRICEVERIFYSUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_PRICEVERIFY_PRICEVERIFYSUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_PRICEVERIFY_PRICEVERIFYSUPABASE_PUBLISHABLE_KEY,
  );

  if (!url || !anonKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ''),
    anonKey,
    serviceRoleKey: primerValor(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.PRICEVERIFY_SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
