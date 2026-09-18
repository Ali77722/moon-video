const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');

(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1280,height:720}, deviceScaleFactor:1});
  await page.goto('file://' + require('path').resolve('index.html'), {waitUntil:'load'});
  await page.waitForTimeout(500);
  const fps=30, duration=45;
  const ff = spawn('ffmpeg',['-y','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','moon-video.mp4'],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<duration*fps;i++){
    const t=i/fps;
    await page.evaluate(t=>window.setVideoTime(t),t);
    const shot=await page.screenshot({type:'jpeg',quality:88});
    if(!ff.stdin.write(shot)) await new Promise(r=>ff.stdin.once('drain',r));
  }
  ff.stdin.end();
  await new Promise((resolve,reject)=>{ff.on('close',code=>code===0?resolve():reject(new Error('ffmpeg exited '+code)))});
  await browser.close();
  console.log('Rendered moon-video.mp4',fs.statSync('moon-video.mp4').size,'bytes');
})();