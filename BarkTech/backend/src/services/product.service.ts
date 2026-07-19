import { productRepository, categoryRepository } from '../repositories/product.repository.js';
import { AppError } from '../utils/errors.js';

export class ProductService {
  async getProduct(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async getProductBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async listProducts(filters: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    published?: boolean;
    isFeatured?: boolean;
  }) {
    return productRepository.findAll(filters);
  }

  async createProduct(data: any) {
    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) throw new AppError('Category not found', 404);
    }
    return productRepository.create(data);
  }

  async updateProduct(id: string, data: any) {
    const product = await productRepository.update(id, data);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async deleteProduct(id: string) {
    const deleted = await productRepository.delete(id);
    if (!deleted) throw new AppError('Product not found', 404);
  }

  // ── Categories ──────────────────────────────────────
  async listCategories() {
    return categoryRepository.findAll();
  }

  async createCategory(data: any) {
    return categoryRepository.create(data);
  }

  async updateCategory(id: string, data: any) {
    const category = await categoryRepository.update(id, data);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  }

  // ── Specs ──────────────────────────────────────────────
  async addSpec(productId: string, data: { key: string; value: string; unit?: string }) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    const mongoose = await import('mongoose');
    const spec = { _id: new mongoose.Types.ObjectId().toString(), ...data };
    await productRepository.update(productId, { $push: { specs: spec } });
    return productRepository.findById(productId);
  }

  async updateSpec(productId: string, specId: string, data: any) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    await productRepository.update(productId, { $set: { 'specs.$[elem]': data } }, { arrayFilters: [{ 'elem._id': specId }] });
    return productRepository.findById(productId);
  }

  async deleteSpec(productId: string, specId: string) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    await productRepository.update(productId, { $pull: { specs: { _id: specId } } });
    return productRepository.findById(productId);
  }
}

export const productService = new ProductService();
