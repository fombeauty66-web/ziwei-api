const lunar = require('lunar-javascript');

module.exports = async (req, res) => {
  // 允许跨域（Base44 必备）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date } = req.query;
    // 格式化日期：处理空格和 T
    const dateStr = (date || '2026-03-28 12:00:00').replace('T', ' ').replace(/\+/g, ' ');
    
    // 检查库是否加载成功
    if (!lunar.Solar || !lunar.Iziwei) {
      return res.status(500).json({ error: "模块缺失", keys: Object.keys(lunar) });
    }

    const solar = lunar.Solar.fromDate(new Date(dateStr));
    const lunarDate = solar.getLunar();
    
    // 排盘核心
    const iZhiWei = lunar.Iziwei.fromLunar(lunarDate);
    const palaces = iZhiWei.getPalaces();

    // 只返回 Base44 核心需要的数据，保持简洁
    const result = {
      bazi: lunarDate.getEightChar().toString(),
      palaces: palaces.map(p => ({
        name: p.getName(),
        stars: p.getMajorStars().concat(p.getMinorStars()),
        sihua: p.getSiHua() || ""
      }))
    };

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: "代码运行错误", detail: e.message });
  }
};
