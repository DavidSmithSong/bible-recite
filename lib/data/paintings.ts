export interface Painting {
  url: string
  title: string
  artistZh: string
  year: string
}

export const HERO: Painting = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Transfiguration_Raphael.jpg/1280px-Transfiguration_Raphael.jpg',
  title: 'The Transfiguration',
  artistZh: '拉斐尔',
  year: '1520',
}

// One Old Master painting per lesson — 250px thumbnails (valid Wikimedia size)
export const LESSON_PAINTINGS: Record<number, Painting> = {
  1: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/V%26A_-_Raphael%2C_Christ%27s_Charge_to_Peter_%281515%29.jpg/250px-V%26A_-_Raphael%2C_Christ%27s_Charge_to_Peter_%281515%29.jpg',
    title: "Christ's Charge to Peter", artistZh: '拉斐尔', year: '1515',
  },
  2: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/The_Calling_of_Saint_Matthew-Caravaggo_%281599-1600%29.jpg/250px-The_Calling_of_Saint_Matthew-Caravaggo_%281599-1600%29.jpg',
    title: 'The Calling of Saint Matthew', artistZh: '卡拉瓦乔', year: '1600',
  },
  3: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Rembrandt_-_The_Philosopher_in_Meditation.jpg/250px-Rembrandt_-_The_Philosopher_in_Meditation.jpg',
    title: 'The Philosopher in Meditation', artistZh: '伦勃朗', year: '1632',
  },
  4: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Rembrandt_Harmensz._van_Rijn_-_Jeremia_treurend_over_de_verwoesting_van_Jeruzalem_-_Google_Art_Project.jpg/250px-Rembrandt_Harmensz._van_Rijn_-_Jeremia_treurend_over_de_verwoesting_van_Jeruzalem_-_Google_Art_Project.jpg',
    title: 'Jeremiah Lamenting Jerusalem', artistZh: '伦勃朗', year: '1630',
  },
  5: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Bellini%2CGiovanni_-_Agony_in_the_Garden_-_National_Gallery.jpg/250px-Bellini%2CGiovanni_-_Agony_in_the_Garden_-_National_Gallery.jpg',
    title: 'Agony in the Garden', artistZh: '乔瓦尼·贝利尼', year: '1459',
  },
  6: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Angelico_-_Annunciation_-_San_Marco_north_corridor.jpg/250px-Angelico_-_Annunciation_-_San_Marco_north_corridor.jpg',
    title: 'Annunciation', artistZh: '弗拉·安杰利科', year: '1442',
  },
  7: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Andrey_Rublev_-_%D0%A1%D0%B2._%D0%A2%D1%80%D0%BE%D0%B8%D1%86%D0%B0_-_Google_Art_Project.jpg/250px-Andrey_Rublev_-_%D0%A1%D0%B2._%D0%A2%D1%80%D0%BE%D0%B8%D1%86%D0%B0_-_Google_Art_Project.jpg',
    title: 'The Trinity', artistZh: '鲁布廖夫', year: '1410',
  },
  8: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/250px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg',
    title: 'The Creation of Adam', artistZh: '米开朗基罗', year: '1512',
  },
  9: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Masaccio-TheExpulsionOfAdamAndEveFromEden-Restoration.jpg/250px-Masaccio-TheExpulsionOfAdamAndEveFromEden-Restoration.jpg',
    title: 'Expulsion from Eden', artistZh: '马萨乔', year: '1425',
  },
  10: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg/250px-Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg',
    title: 'Return of the Prodigal Son', artistZh: '伦勃朗', year: '1669',
  },
  11: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Peter_Paul_Rubens_-_Descent_from_the_Cross_-_WGA20212.jpg/250px-Peter_Paul_Rubens_-_Descent_from_the_Cross_-_WGA20212.jpg',
    title: 'Descent from the Cross', artistZh: '鲁本斯', year: '1614',
  },
  12: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Raphael1a.jpg/250px-Raphael1a.jpg',
    title: 'Disputation of the Holy Sacrament', artistZh: '拉斐尔', year: '1510',
  },
  13: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Leonardo_da_Vinci_%281452-1519%29_-_The_Last_Supper_%281495-1498%29.jpg/250px-Leonardo_da_Vinci_%281452-1519%29_-_The_Last_Supper_%281495-1498%29.jpg',
    title: 'The Last Supper', artistZh: '达·芬奇', year: '1498',
  },
  14: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Pentecost%C3%A9s_%28El_Greco%2C_c._1600%29_Prado.jpg/250px-Pentecost%C3%A9s_%28El_Greco%2C_c._1600%29_Prado.jpg',
    title: 'Pentecost', artistZh: '埃尔·格雷科', year: '1600',
  },
  15: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Raphael_Holy_Family_with_the_Lamb.jpg/250px-Raphael_Holy_Family_with_the_Lamb.jpg',
    title: 'Holy Family with a Lamb', artistZh: '拉斐尔', year: '1507',
  },
  16: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sacrifice_of_Isaac-Caravaggio_%28Uffizi%29.jpg/250px-Sacrifice_of_Isaac-Caravaggio_%28Uffizi%29.jpg',
    title: 'The Sacrifice of Isaac', artistZh: '卡拉瓦乔', year: '1603',
  },
  17: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/El_Lavatorio_%28Tintoretto%29.jpg/250px-El_Lavatorio_%28Tintoretto%29.jpg',
    title: 'El Lavatorio', artistZh: '丁托列托', year: '1548',
  },
  18: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Rembrandt_Christ_Driving_the_Money_Changers_from_the_Temple.jpg/250px-Rembrandt_Christ_Driving_the_Money_Changers_from_the_Temple.jpg',
    title: 'Christ Driving the Money Changers', artistZh: '伦勃朗', year: '1626',
  },
  19: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Raphael_-_The_Miraculous_Draft_of_Fishes_-_Google_Art_Project.jpg/250px-Raphael_-_The_Miraculous_Draft_of_Fishes_-_Google_Art_Project.jpg',
    title: 'The Miraculous Draught of Fishes', artistZh: '拉斐尔', year: '1515',
  },
  20: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg/250px-%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg',
    title: 'The School of Athens', artistZh: '拉斐尔', year: '1511',
  },
  21: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/El_GRECO_%28Domenikos_Theotokopoulos%29_-_Annunciation_-_Google_Art_Project.jpg/250px-El_GRECO_%28Domenikos_Theotokopoulos%29_-_Annunciation_-_Google_Art_Project.jpg',
    title: 'The Annunciation', artistZh: '埃尔·格雷科', year: '1576',
  },
  22: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Le_Grand_Saint_Michel%2C_by_Raffaello_Sanzio%2C_from_C2RMF_retouched.jpg/250px-Le_Grand_Saint_Michel%2C_by_Raffaello_Sanzio%2C_from_C2RMF_retouched.jpg',
    title: 'Saint Michael Overwhelming the Demon', artistZh: '拉斐尔', year: '1518',
  },
  23: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Rembrandt_-_Jacob_Wrestling_with_the_Angel_-_Google_Art_Project.jpg/250px-Rembrandt_-_Jacob_Wrestling_with_the_Angel_-_Google_Art_Project.jpg',
    title: 'Jacob Wrestling with the Angel', artistZh: '伦勃朗', year: '1659',
  },
  24: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Saint_Paul%2C_Rembrandt_van_Rijn_%28and_Workshop%3F%29%2C_c._1657.jpg/250px-Saint_Paul%2C_Rembrandt_van_Rijn_%28and_Workshop%3F%29%2C_c._1657.jpg',
    title: 'The Apostle Paul', artistZh: '伦勃朗', year: '1657',
  },
  25: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Rembrandt_-_The_Parable_of_the_Rich_Fool.jpg/250px-Rembrandt_-_The_Parable_of_the_Rich_Fool.jpg',
    title: 'The Parable of the Rich Fool', artistZh: '伦勃朗', year: '1627',
  },
}
