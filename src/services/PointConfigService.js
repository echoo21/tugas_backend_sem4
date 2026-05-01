import BaseService from './BaseService.js';

class PointConfigService extends BaseService {
  async getConfigForUser(userId) {
    const agg = await this.prisma.transactions.groupBy({
      by: ['userId'],
      where: { userId, status: 'SUCCESS' },
      _sum: { totalPaid: true }
    });
    const totalSpent = agg[0]?._sum.totalPaid ?? 0;

    const config = await this.prisma.point_configs.findFirst({
      where: { minSpent: { lte: totalSpent } },
      orderBy: { minSpent: 'desc' }
    });

    if (!config) {
      return await this.prisma.point_configs.findUnique({ where: { tierName: 'bronze' } });
    }
    return config;
  }

  async recalculateLevel(userId) {
    const config = await this.getConfigForUser(userId);
    await this.prisma.users.update({
      where: { id: userId },
      data: { level: config.levelNumber }
    });
    return config;
  }
}

export default PointConfigService;
