// Preserve animations by default; a replacement upload or explicit image choice wins.
export function resolveMedia(originalShots,media){
 const shots={...originalShots};
 for(const [slot,m] of Object.entries(media||{})){
  if(m.preferImage||(m.image&&m.image!==originalShots[slot])){
   delete shots[slot+'@video'];delete shots[slot+'@webm'];
  }
  if(m.image)shots[slot]=m.image;
  shots[slot+'@alt']=m.alt;shots[slot+'@caption']=m.caption;
 }
 return shots;
}
