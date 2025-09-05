import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto, UpdateNewsDto, UpdateNewsStatusDto, NewsQueryDto } from './dto/news.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NewsStatus } from '@prisma/client';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createNewsDto: CreateNewsDto) {
    const news = await this.newsService.create(createNewsDto);
    return {
      success: true,
      message: '新闻创建成功',
      data: news,
    };
  }

  // 公开接口：获取已发布的新闻列表
  @Get('public')
  async findPublished(@Query() query: NewsQueryDto) {
    // 强制只查询已发布的新闻
    const publicQuery = { ...query, status: NewsStatus.PUBLISHED };
    const result = await this.newsService.findAll(publicQuery);
    return {
      success: true,
      message: '获取新闻列表成功',
      data: result,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: NewsQueryDto) {
    const result = await this.newsService.findAll(query);
    return {
      success: true,
      message: '获取新闻列表成功',
      data: result,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    const stats = await this.newsService.getStats();
    return {
      success: true,
      message: '获取新闻统计成功',
      data: stats,
    };
  }

  // 公开接口：获取单个已发布新闻详情
  @Get('public/:id')
  async findOnePublished(@Param('id') id: string) {
    const news = await this.newsService.findOnePublished(id);
    return {
      success: true,
      message: '获取新闻详情成功',
      data: news,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const news = await this.newsService.findOne(id);
    return {
      success: true,
      message: '获取新闻详情成功',
      data: news,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto) {
    const news = await this.newsService.update(id, updateNewsDto);
    return {
      success: true,
      message: '新闻更新成功',
      data: news,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateNewsStatusDto) {
    const news = await this.newsService.updateStatus(id, updateStatusDto.status);
    return {
      success: true,
      message: '新闻状态更新成功',
      data: news,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.newsService.remove(id);
    return {
      success: true,
      message: '新闻删除成功',
    };
  }
}
