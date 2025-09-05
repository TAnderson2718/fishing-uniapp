const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedContent() {
  console.log('🌱 开始创建内容管理系统种子数据...');

  try {
    // 创建轮播图数据
    console.log('📸 创建轮播图数据...');
    const banners = await Promise.all([
      prisma.banner.create({
        data: {
          title: '春季钓鱼大赛',
          description: '参与春季钓鱼大赛，赢取丰厚奖品！',
          imageUrl: '/static/images/banner1.jpg',
          linkType: 'ACTIVITY',
          linkValue: 'spring-fishing-contest',
          sortOrder: 1,
          isActive: true,
        },
      }),
      prisma.banner.create({
        data: {
          title: '新品装备上市',
          description: '最新钓鱼装备，专业品质，优惠价格',
          imageUrl: '/static/images/banner2.jpg',
          linkType: 'ARTICLE',
          linkValue: '', // 将在创建文章后更新
          sortOrder: 2,
          isActive: true,
        },
      }),
      prisma.banner.create({
        data: {
          title: '会员专享优惠',
          description: '成为会员享受更多优惠和特权',
          imageUrl: '/static/images/banner3.jpg',
          linkType: 'EXTERNAL',
          linkValue: '/pages/membership/index',
          sortOrder: 3,
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ 创建了 ${banners.length} 个轮播图`);

    // 注意：Article系统已移除，现在使用News系统
    console.log('📝 Article系统已移除，请使用News系统管理资讯内容');

    console.log('🎉 内容管理系统种子数据创建完成！');
    
  } catch (error) {
    console.error('❌ 创建种子数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedContent()
    .then(() => {
      console.log('✅ 种子数据创建成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 种子数据创建失败:', error);
      process.exit(1);
    });
}

module.exports = { seedContent };
