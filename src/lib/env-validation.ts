import { validateProviderKeys } from './provider-registry';

export function validateEnvironment() {
  const missing = validateProviderKeys();

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some LLM providers will not be available.');
    console.warn('Add these to your .env.local file to enable all models.');
  }

  return {
    isValid: missing.length === 0,
    missing,
    hasAnyProvider: missing.length < 4, // At least one provider should work
  };
}

export function getAvailableProviders() {
  const validation = validateEnvironment();
  const allProviders = ['openai', 'google', 'groq', 'xai'] as const;

  return allProviders.filter(provider => {
    const envKey = `${provider.toUpperCase()}_API_KEY`;
    return !validation.missing.includes(envKey);
  });
}
