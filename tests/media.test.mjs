import test from 'node:test';import assert from 'node:assert/strict';import {resolveMedia} from '../scripts/media.mjs';
test('production media resolution keeps default animation and removes it for replacement or still choice',()=>{
 const original={slot:'/screenshots/slot.webp','slot@video':'/screenshots/slot.mp4','slot@webm':'/screenshots/slot.webm'};
 assert.equal(resolveMedia(original,{slot:{image:original.slot}})['slot@video'],original['slot@video']);
 assert.equal(resolveMedia(original,{slot:{image:'/uploads/new.png'}})['slot@video'],undefined);
 assert.equal(resolveMedia(original,{slot:{preferImage:true}})['slot@webm'],undefined);
 assert.equal(original['slot@video'],'/screenshots/slot.mp4');
});
