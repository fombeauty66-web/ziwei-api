const lunar = require('lunar-javascript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { date } = req.query;
    const finalDate = (date || '2026-03-28 12:00:00').replace('T', ' ').replace(/\+/g, ' ');
    const solar = lunar.Solar.fromDate(new Date(finalDate));
    const lunarDate = solar.getLunar();
    const iZhiWei = lunar.Iziwei.fromLunar(lunarDate);
    const palaces = iZhiWei.getPalaces();

    return res.status(200).json({
      bazi: lunarDate.getEightChar().toString(),
      palaces: palaces.map(p => ({
        name: p.getName(),
        stars: p.getMajorStars().concat(p.getMinorStars()),
        sihua: p.getSiHua() || ""
      }))
    });
  } catch (e) {
    return res.status(500).json({ error: "排盘异常", detail: e.message });
  }
};
