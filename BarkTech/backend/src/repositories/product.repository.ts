import { Product, IProduct } from '../models/product.js';
import { Category, ICategory } from '../models/category.js';

export class ProductRepository {
  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).populate('categoryId');
  }

  async findBySlug(slug: string): Promise<IProduct | null> {
    return Product.findOne({ slug }).populate('categoryId');
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    published?: boolean;
    isFeatured?: boolean;
  }): Promise<{ products: IProduct[]; total: number }> {
    const { page = 1, limit = 20, categoryId, search, published = true, isFeatured } = filters;
    const query: Record<string, any> = {};

    if (published !== undefined) query.published = published;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (categoryId) query.categoryId = categoryId;
    if (search) {
      query.$text = { $search: search };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    return { products, total };
  }

  async create(data: Partial<IProduct>): Promise<IProduct> {
    return Product.create(data);
  }

  async update(id: string, data: any, options?: any): Promise<any> {
    return Product.findByIdAndUpdate(id, data, { new: true, ...options });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    return !!result;
  }
}

export class CategoryRepository {
  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug });
  }

  async findAll(): Promise<ICategory[]> {
    return Category.find({ isActive: true }).sort({ sortOrder: 1 });
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    return Category.create(data);
  }

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, data, { new: true });
  }
}

export const productRepository = new ProductRepository();
export const categoryRepository = new CategoryRepository();
