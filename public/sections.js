// Separate screens share the same content records and course detail dialogs.
const pages={
 home:{label:'Главная',sections:['.hero','#directions']},
 clay:{label:'Глина',category:'pottery',sections:['#classes','.process-section'],intro:'Гончарный круг, ручная лепка, семейные занятия и свидания для двоих.'},
 painting:{label:'Живопись',category:'art',sections:['#classes'],intro:'Индивидуальные и групповые занятия по рисунку и живописи.'},
 kids:{label:'Детские курсы',sections:['#children','#course-benefits']},
 crafts:{label:'Другие ремёсла',category:'guest',sections:['#classes'],intro:'Плетение и творческие встречи с приглашёнными мастерами.'},
 schedule:{label:'Расписание',sections:['#schedule']},
 gallery:{label:'Галерея',sections:['#gallery']},
 about:{label:'О мастерской',sections:['#about','.faq-section']},
 together:{label:'Свидание для двоих',sections:['#together']},
 contacts:{label:'Контакты',sections:[]}
};
const aliases={classes:'clay',children:'kids',pottery:'clay',art:'painting',guest:'crafts',all:'clay'};
let state,initialized=false;
const routeName=value=>aliases[value]|| (pages[value]?value:'home');
const routeHash=()=>routeName(location.hash.slice(1));
function showPage({focus=false}={}){
 if(!state)return;
 const name=routeHash(),page=pages[name];
 if(page.category){state.selectCategory(page.category);document.querySelector('#classes-title').textContent=page.label;document.querySelector('#classes .section-intro').textContent=page.intro;}
 for(const element of document.querySelectorAll('#main > section, #main > div')){
  const visible=page.sections.some(selector=>element.matches(selector));
  element.hidden=!visible;element.classList.toggle('section-screen-hidden',!visible);
 }
 for(const link of document.querySelectorAll('[data-section-page]')){
  const active=link.dataset.sectionPage===(name==='together'?'clay':name);
  link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 }
 document.title=(name==='home'?'':page.label+' — ')+state.content.name;
 document.body.dataset.page=name;
 const target=name==='contacts'?document.querySelector('#contacts'):document.querySelector('#main');
 if(focus){window.scrollTo({top:name==='contacts'?target.offsetTop:0,behavior:'instant'});target.tabIndex=-1;target.focus({preventScroll:true});}
}
function navigate(name){
 const hash='#'+routeName(name);
 if(location.hash===hash)showPage({focus:true});else location.hash=hash;
}
export function setupSections(value){
 state=value;
 if(!initialized){
  initialized=true;
  const navHTML=Object.entries(pages).filter(([name])=>!['together','contacts'].includes(name)).map(([name,page])=>`<a href="#${name}" data-section-page="${name}">${page.label}</a>`).join('');
  const navigation=document.querySelector('.section-nav');navigation.innerHTML=navHTML;navigation.classList.add('page-navigation');navigation.setAttribute('aria-label','Разделы сайта');
  document.querySelector('#mobile-nav').innerHTML=navHTML;
  const directions=document.createElement('section');directions.id='directions';directions.className='section wrap directions';directions.setAttribute('aria-labelledby','directions-title');
  const cards=[['clay','Глина','Лепка и гончарный круг','pottery'],['painting','Живопись','Рисунок и работа с цветом','art'],['kids','Детские курсы','Занятия для юных мастеров','kids'],['crafts','Другие ремёсла','Плетение и творческие встречи','guest']];
  const heading=document.createElement('h2');heading.id='directions-title';heading.textContent='Выберите направление';directions.append(heading);
  const grid=document.createElement('div');grid.className='direction-grid';
  for(const [name,title,description,category]of cards){
   if(!state.content.courses.some(c=>c.category===category))continue;
   const link=document.createElement('a');link.href='#'+name;link.className='direction-link';
   const label=document.createElement('h3');label.textContent=title;const text=document.createElement('p');text.textContent=description;const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');link.append(label,text,arrow);grid.append(link);
  }
  directions.append(grid);document.querySelector('.hero').after(directions);
  document.addEventListener('click',event=>{
   const link=event.target.closest('a[href^="#"]');if(!link||link.hasAttribute('data-course')||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
   const raw=link.dataset.catalog||link.getAttribute('href').slice(1);
   if(raw==='main')return;
   if(!raw||pages[raw]||aliases[raw]){event.preventDefault();navigate(raw);}
  });
  window.addEventListener('hashchange',()=>showPage({focus:true}));
 }
 showPage();
}
