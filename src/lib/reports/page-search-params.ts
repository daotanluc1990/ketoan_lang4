export type PageSearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> | undefined;

export async function resolvePageSearchParams(searchParams: PageSearchParams) {
  return await Promise.resolve(searchParams ?? {});
}
