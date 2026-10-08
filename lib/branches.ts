// Addresses and hours checked against Jollibee's store list on 2026-10-08.
// District labels keep the familiar area names supplied by the project owner.
export const branchSource = 'https://help.jollibee.com.vn/hc/vi/articles/14378093877775-Danh-s%C3%A1ch-c%E1%BB%ADa-h%C3%A0ng';
export const branches = [
  {name:'Jollibee Pasteur',shortName:'Pasteur',area:'Quận 3',address:'194D Pasteur, phường Xuân Hòa, TP. Hồ Chí Minh',opens:'08:00',closes:'22:00',description:'Ngay trung tâm thành phố, thuận tiện ghé dùng món hoặc lấy hàng.',aliases:['pasteur','194d pasteur']},
  {name:'Jollibee Tô Hiến Thành',shortName:'Tô Hiến Thành',area:'Quận 10',address:'245 Tô Hiến Thành, phường Hòa Hưng, TP. Hồ Chí Minh',opens:'09:00',closes:'22:00',description:'Một lựa chọn cho bữa ăn cùng gia đình hoặc nhóm bạn.',aliases:['to hien thanh','245 to hien thanh']},
  {name:'Jollibee Giga Mall Phạm Văn Đồng',shortName:'Giga Mall Phạm Văn Đồng',area:'TP. Thủ Đức',address:'Tầng B1, TTTM Giga Mall, 240–242 Phạm Văn Đồng, phường Hiệp Bình, TP. Hồ Chí Minh',opens:'09:00',closes:'22:00',description:'Nằm tại tầng B1 trung tâm thương mại Giga Mall.',aliases:['giga mall','gigamall','pham van dong','thu duc','hiep binh']},
  {name:'Jollibee Lê Trọng Tấn',shortName:'Lê Trọng Tấn',area:'Quận Tân Phú',address:'387 Lê Trọng Tấn, phường Tân Sơn Nhì, TP. Hồ Chí Minh',opens:'09:00',closes:'22:00',description:'Chi nhánh trên đường Lê Trọng Tấn, khu vực Tân Phú.',aliases:['le trong tan','tan phu','tan son nhi']},
  {name:'Jollibee Hậu Giang',shortName:'Hậu Giang',area:'Quận 6',address:'704 Hậu Giang, phường Phú Lâm, TP. Hồ Chí Minh',opens:'09:00',closes:'22:00',description:'Cửa hàng thứ 200 của Jollibee tại Việt Nam, khai trương ngày 12/12/2024.',aliases:['hau giang','704 hau giang']},
  {name:'Jollibee Phan Xích Long',shortName:'Phan Xích Long',area:'Quận Phú Nhuận',address:'201 Phan Xích Long, phường Cầu Kiệu, TP. Hồ Chí Minh',opens:'09:00',closes:'22:00',description:'Nằm trên tuyến đường Phan Xích Long, khu vực Phú Nhuận.',aliases:['phan xich long','phu nhuan','cau kieu']},
] as const;
export type Branch = typeof branches[number];
export const branchNames = branches.map(b=>b.name);
export const getBranch = (name:string) => branches.find(b=>b.name===name);
const normalizeBranch = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
export function findBranch(text:string) {
  const s=normalizeBranch(text);
  const named=branches.filter(b=>b.aliases.some(alias=>s.includes(alias)));
  // Never silently pick between two branches mentioned in one message.
  if(named.length)return named.length===1?named[0]:undefined;
  const district=s.match(/(?:quan\s*|q\.?\s*)(\d{1,2})\b/);
  return district?branches.find(b=>b.area==='Quận '+Number(district[1])):undefined;
}
