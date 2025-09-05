import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto, UpdateNewsDto, NewsQueryDto } from './dto/news.dto';
import { NewsStatus, Prisma } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async create(createNewsDto: CreateNewsDto) {
    const { title, content, author, status } = createNewsDto;
    
    const newsData: Prisma.NewsCreateInput = {
      title,
      content,
      author,
      status: status || NewsStatus.DRAFT,
      publishedAt: status === NewsStatus.PUBLISHED ? new Date() : null,
    };

    return this.prisma.news.create({
      data: newsData,
    });
  }

  async findAll(query: NewsQueryDto) {
    const {
      page = 1,
      pageSize = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const where: Prisma.NewsWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 构建排序条件
    const orderBy: Prisma.NewsOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.news.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    return news;
  }

  async findOnePublished(id: string) {
    const news = await this.prisma.news.findUnique({
      where: {
        id,
        status: NewsStatus.PUBLISHED
      },
    });

    if (!news) {
      throw new NotFoundException('新闻不存在或未发布');
    }

    return news;
  }

  async update(id: string, updateNewsDto: UpdateNewsDto) {
    const existingNews = await this.findOne(id);

    const updateData: Prisma.NewsUpdateInput = {
      ...updateNewsDto,
    };

    // 如果状态变更为已发布，设置发布时间
    if (updateNewsDto.status === NewsStatus.PUBLISHED && existingNews.status !== NewsStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }

    // 如果状态从已发布变为草稿，清除发布时间
    if (updateNewsDto.status === NewsStatus.DRAFT && existingNews.status === NewsStatus.PUBLISHED) {
      updateData.publishedAt = null;
    }

    return this.prisma.news.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStatus(id: string, status: NewsStatus) {
    const existingNews = await this.findOne(id);

    const updateData: Prisma.NewsUpdateInput = {
      status,
    };

    // 如果状态变更为已发布，设置发布时间
    if (status === NewsStatus.PUBLISHED && existingNews.status !== NewsStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }

    // 如果状态从已发布变为草稿，清除发布时间
    if (status === NewsStatus.DRAFT && existingNews.status === NewsStatus.PUBLISHED) {
      updateData.publishedAt = null;
    }

    return this.prisma.news.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // 确保新闻存在

    return this.prisma.news.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, published, draft] = await Promise.all([
      this.prisma.news.count(),
      this.prisma.news.count({ where: { status: NewsStatus.PUBLISHED } }),
      this.prisma.news.count({ where: { status: NewsStatus.DRAFT } }),
    ]);

    return {
      total,
      published,
      draft,
    };
  }
}
