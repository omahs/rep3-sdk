// function generateLevelCategory(levels: [number], categories: [number]) {
//   let levelCategoryArray = [];
//   for (let i = 0; i < levels.length; i++) {
//     const levelCategory = (levels[i] << 8) | categories[i];
//     levelCategoryArray.push(levelCategory);
//   }
//   return levelCategoryArray;
// }
function generateData(levels: string | any[], categories: string | any[]) {
  if (levels.length != categories.length) {
    return [];
  }
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
  const data = generateData(levels, categories);
  const voucher = { data, end, to, tokenUris };
  return voucher;
};
