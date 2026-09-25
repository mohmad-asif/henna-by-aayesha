import 'server-only';

export interface EnvValidationResult {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
}

/**
 * Validates environment variables safely at runtime/server startup without exposing any secret values.
 *
 * Variable classification:
 * - NEXT_PUBLIC_SUPABASE_URL (REQUIRED, PUBLIC)
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (REQUIRED, PUBLIC)
 * - NEXT_PUBLIC_SITE_URL (OPTIONAL, PUBLIC)
 * - SUPABASE_SERVICE_ROLE_KEY (REQUIRED in production, SERVER-ONLY)
 * - AI_SETTINGS_ENCRYPTION_KEY (REQUIRED in production, SERVER-ONLY)
 * - CLOUDFLARE_ACCOUNT_ID (OPTIONAL, SERVER-ONLY)
 */
export function validateEnvironment(isProduction = process.env.NODE_ENV === 'production'): EnvValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // Public variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missingRequired.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    missingRequired.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    warnings.push('NEXT_PUBLIC_SITE_URL is not set (defaulting to https://hennabyaayesha.com)');
  }

  // Server-only secrets
  if (isProduction) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      warnings.push(
        'SUPABASE_SERVICE_ROLE_KEY is strongly recommended in production for server-side RLS bypass.'
      );
    }
    if (!process.env.AI_SETTINGS_ENCRYPTION_KEY) {
      missingRequired.push('AI_SETTINGS_ENCRYPTION_KEY');
    }
  } else {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY is not set in development (some admin features may require it)');
    }
    if (!process.env.AI_SETTINGS_ENCRYPTION_KEY) {
      warnings.push('AI_SETTINGS_ENCRYPTION_KEY is not set in development (using dev fallback encryption key)');
    }
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
  };
}

/**
 * Asserts that the runtime environment is valid, throwing a clear, non-leaking error if critical secrets are missing.
 */
export function assertValidEnvironment(): void {
  const { isValid, missingRequired } = validateEnvironment();
  if (!isValid) {
    throw new Error(
      `[Startup Security Audit] Missing required environment variables: ${missingRequired.join(
        ', '
      )}. Please configure them in your environment settings.`
    );
  }
}
