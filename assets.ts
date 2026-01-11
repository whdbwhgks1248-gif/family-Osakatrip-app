
/**
 * 이미지를 로드하는 방법:
 * 구글 드라이브 '공유' 설정에서 '링크가 있는 모든 사용자'에게 '뷰어' 권한을 주어야 합니다.
 * 링크 형식: https://drive.google.com/uc?export=view&id=[ID]
 */

const getGDriveUrl = (id: string) => id ? `https://drive.google.com/uc?export=view&id=${id}` : "";

export const IMAGES = {
  // Day 1 & 2
  camonhotel: getGDriveUrl("1epPRIIobCxEjKK4Kj1IVgE80qIxyrZQ7"),
  hanana: getGDriveUrl("1zIOW4DLgGW9J3Fuj95vDyUrcZ8Xbcjun"),
  arashiyama: getGDriveUrl("1L4QeKoVGTFakH0_V0liw5nVEhyHa1ODA"),
  nishiki_market: getGDriveUrl("11sey_bkl8yzWwHHFMnaqARXxCFB59vJp"),
  redrock: getGDriveUrl("1dQxWvw_EnRG2oT3_dPeMT-YadY7aaiX-"),
  aeonmall: getGDriveUrl("1kjMtuhLGPPITyWPQOI58dV3ZFzKN1BdI"),
  rinn_kujo: "",

  // Day 3
  kiyomizudera: getGDriveUrl("1I3ulyt7n896ZqqhYg5RV07DRNNxW2r8i"),
  lunch_hanakagami: getGDriveUrl("1ntC77IAgMOEqMNus8J_DO5vMF5mo1vvq"),
  okaffe: getGDriveUrl("1yE9LAKN1uYJxmGw86Ri7IxHl_jwUy-70"),
  stationery: getGDriveUrl("1CqGfUm2kzPQnbDj7PQ_ZsLQNO8cSBEHR"),
  kaneko_confirm1: getGDriveUrl("1By_cHsiPVw00qRgS3275DdUBLDcsw9od"),
  kaneko_confirm2: getGDriveUrl("1RqyJYQsAmlZ7Ai2ptHrGxnnp0Vs0N2S0"),
  hinodeyu: getGDriveUrl("1u3jLWSZ7pEUSdyB-e1-Ti8Uyd9WL4kMz"),

  // Day 4
  aoitori: getGDriveUrl("11iZMPCUeuxVTnUh6H9zzzzhJPA63aZV2"),
  fushimi_inari: getGDriveUrl("1jRujtqMod3Rgv79WsWxS3wZAN0Szf3lc"),
  kokohotel: getGDriveUrl("1tQR1pDRnqNjY9WevuevZdCYOx9nzjQfd"),
  sashisu: getGDriveUrl("1f2GjtFVPGcNUwPLAVKdtmvdNSnw_kZId"),
  near_guromon: getGDriveUrl("1ZD7-2-LCr04E4IWlPr4C6xUbXi7WXKhs"),
  shinsaibashi: getGDriveUrl("15ju4yD0LYQuat_IKVaP8FMpg2zlNsPEJ"),
  momiji_reserve: getGDriveUrl("1DflgnLZYz5jTG06ke-9KPX26eKSlaB4-"),
  donki: getGDriveUrl("1jZn4FLJfdeY1wCcOzCsWnBMNL7Xv6JBT"),

  // Day 5
  onigiri_matsu: "",
  daiso_gigo: "",
  gyukatsu_tomita: getGDriveUrl("1QlUicXFfpY7K5YGombzbdp6pDgv58qil"),
  osaka_castle: getGDriveUrl("1lnImuzNhmyqWwmYFtvPadeHZAOXBDVYe"),
  marufuku_coffee: getGDriveUrl("1eD62PhcOOR21rscLXplVk3OExrLR0nC2"),
};
