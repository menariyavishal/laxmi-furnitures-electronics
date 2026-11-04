export async function getCategories(department?: string) {
  const url = department && department !== "ALL"
    ? `/api/v1/categories?department=${encodeURIComponent(department)}`
    : "/api/v1/categories";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createCategory(data: { name: string; parentCategoryId?: number; department?: string }) {
  const res = await fetch("/api/v1/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}

export async function getProducts(
  categoryId?: number,
  search?: string,
  excludeCategoryName?: string,
  page?: number,
  limit?: number,
  excludeProductType?: string,
  productType?: string,
  department?: string
) {
  const params = new URLSearchParams();
  if (categoryId) params.append("categoryId", categoryId.toString());
  if (search) params.append("search", search);
  if (excludeCategoryName) params.append("excludeCategoryName", excludeCategoryName);
  if (excludeProductType) params.append("excludeProductType", excludeProductType);
  if (productType) params.append("productType", productType);
  if (department && department !== "ALL") params.append("department", department);
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const url = `/api/v1/products${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function createProduct(data: any) {
  const res = await fetch("/api/v1/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create product");
  }
  return res.json();
}

export async function addStock(productId: number, data: any) {
  const res = await fetch(`/api/v1/products/${productId}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add stock");
  }
  return res.json();
}

export async function updateProduct(productId: number, data: any) {
  const res = await fetch(`/api/v1/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update product");
  }
  return res.json();
}

export async function deleteProduct(productId: number) {
  const res = await fetch(`/api/v1/products/${productId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete product");
  }
  return res.json();
}

export async function quickSell(productId: number, quantity: number) {
  const res = await fetch(`/api/v1/products/quick-sell`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to quick sell item");
  }
  return res.json();
}
