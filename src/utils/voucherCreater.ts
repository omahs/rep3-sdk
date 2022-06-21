function generateLevelCategory(levels: [number], categories: [number]) {
  let levelCategoryArray = [];
  for (let i = 0; i < levels.length; i++) {
    const levelCategory = (levels[i] << 8) | categories[i];
    levelCategoryArray.push(levelCategory);
  }
  return levelCategoryArray;
}

export const createVoucher = (
  levels: [number],
  categories: [number],
  end: any,
  to: [string],
  tokenUris: string
) => {
  const levelCategory = generateLevelCategory(levels, categories);
  const voucher = { levelCategory, end, to, tokenUris };
  return voucher;
};
