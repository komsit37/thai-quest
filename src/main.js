import{createInitialState,persistProgress,upsertSeenVocab,markVocabAnswer,markSpeechAttempt,hasChapterCheckpoint,clearChapterCheckpoint}from'./state.js';
import{speakStory,stopAudio,wireAudioDelegation}from'./audio.js';
import{fallbackChapter,generateChapter}from'./story.js';
import{listenThaiOnce,scoreThaiSpeech,scoreShadowLine,scoreSpokenChoice,renderDiffHtml,supportsSpeechPractice}from'./speech.js';

export function startThaiQuestApp(){
  const s=createInitialState();
  const $=q=>document.querySelector(q);
  $('#apiKey').value=s.apiKey||'';
  $('#kidName').value=s.kidName||'';
  wireAudioDelegation(document);

  document.querySelectorAll('[data-interest]').forEach(b=>{if((s.interests||[]).includes(b.dataset.interest))b.classList.add('selected')});
  $('#interests').onclick=e=>{const b=e.target.closest('[data-interest]');if(b)b.classList.toggle('selected')};
  $('#startBtn').onclick=start;
  const continueBtn=$('#continueBtn');
  if(continueBtn&&hasChapterCheckpoint(s)&&s.currentChapter){continueBtn.style.display='block';continueBtn.onclick=resumeAdventure;setTimeout(resumeAdventure,250)}

  async function resumeAdventure(){
    $('#setup').style.display='none';
    $('#story').style.display='block';
    updateStats();
    await load();
  }

  async function start(){
    s.apiKey=$('#apiKey').value.trim();
    s.kidName=$('#kidName').value.trim()||s.kidName||'Friend';
    s.interests=[...document.querySelectorAll('[data-interest].selected')].map(b=>b.dataset.interest);
    if(!s.apiKey){$('#setupError').textContent='Enter API key';return}
    localStorage.setItem('tq_apiKey',s.apiKey);
    $('#setup').style.display='none';
    $('#story').style.display='block';
    updateStats();
    await load();
  }

  async function load(){
    const box=$('#storyContent');
    box.innerHTML='<div class="card">Writing your quest...</div>';
    if(hasChapterCheckpoint(s)&&s.currentChapter){render();return}
    s.unlockedScenes=1;
    s.bossScore=0;
    try{s.currentChapter=await generateChapter(s)}catch(e){console.warn(e);s.currentChapter=fallbackChapter(s)}
    for(const v of s.currentChapter.targetVocab||[])upsertSeenVocab(s.vocabRecords,v,s.chapter);
    s.storySummary=s.currentChapter.summary||'';
    persistProgress(s);
    render();
  }

  function render(){
    const c=s.currentChapter;if(!c){load();return}
    $('#storyContent').innerHTML=head(c)+scenes(c)+shadow(c)+lessons(c)+speakWords(c)+boss(c)+footer();
    $('#tell').onclick=()=>speakStory(c.chapterNarration||collect(c));
    $('#stop').onclick=stopAudio;
    $('#reset').onclick=resetAll;
    $('#next').onclick=nextChapter;
    document.querySelectorAll('[data-choice-sound]').forEach(b=>b.onclick=e=>{e.stopPropagation();speakStory(b.dataset.choiceSound)});
    document.querySelectorAll('[data-option]').forEach(b=>b.onclick=choose);
    document.querySelectorAll('[data-voice-answer]').forEach(b=>b.onclick=voiceAnswer);
    document.querySelectorAll('[data-shadow]').forEach(b=>b.onclick=doShadow);
    document.querySelectorAll('[data-speak-practice]').forEach(b=>b.onclick=practiceWord);
    document.querySelectorAll('[data-boss-word]').forEach(b=>b.onclick=bossWord);
    document.querySelectorAll('[data-boss-line]').forEach(b=>b.onclick=bossLine);
    updateStats();
  }

  function head(c){return '<article class="scene"><div class="scene-emoji">'+(isBoss()?'🐉':'🪬')+'</div><h2>'+(isBoss()?'Boss Challenge: ':'')+esc(c.title||'Thai Quest')+'</h2><div class="actions"><button id="tell" class="btn-secondary">Tell Story</button><button id="stop" class="btn-secondary">Stop</button><button id="reset" class="btn-secondary">Reset and start over</button></div>'+vocabTray(c)+'</article>'}
  function footer(){return '<div class="actions"><button id="next" class="btn-primary">'+(isBoss()?'Claim Reward':'Next chapter')+'</button></div>'}
  function isBoss(){return s.chapter%3===0}
  function difficulty(){return s.speechStreak>6?.75:s.speechStreak>3?.65:.55}

  function scenes(c){return(c.scenes||[]).map((x,i)=>{if(i>=s.unlockedScenes){const p=c.scenes[i-1]||{};const line=((p.dialogue||[])[0]&&p.dialogue[0].line)||p.narration||'';return '<section class="scene"><div class="scene-emoji">🔒</div><p>Repeat this to unlock the next scene:</p><p>'+esc(line)+'</p><button data-speak="'+esc(line)+'">Hear line</button> <button data-shadow="unlock-'+i+'" data-text="'+esc(line)+'">Speak to unlock</button><p class="feedback" id="unlock-'+i+'"></p></section>'}return '<section class="scene"><div class="scene-emoji">'+esc(x.emoji||'')+'</div><p class="narration">'+markThai(x.narration||'')+'</p>'+((x.dialogue||[]).map(d=>'<p class="dialogue"><span class="speaker">'+esc(d.speaker||'Guide')+'</span>'+markThai(d.line||'')+'</p>').join(''))+'</section>'}).join('')}

  function lessons(c){return(c.lessons||[]).map((l,i)=>'<section class="lesson-card" data-lesson="'+i+'" data-answer="'+esc(l.answer||'')+'"><span class="lesson-tag">'+esc(l.kind||'lesson')+'</span><h3>'+markThai(l.prompt||'')+'</h3><div class="lesson-options">'+((l.options||[]).map(o=>'<div class="choice-row"><button class="btn-secondary" data-choice-sound="'+esc(o)+'">Sound</button><button class="lesson-option" data-option="'+esc(o)+'">'+markThai(o)+'</button></div>').join(''))+'</div><button data-voice-answer="'+esc(l.answer||'')+'">Speak Answer</button><p class="feedback"></p></section>').join('')}

  function choose(e){const btn=e.currentTarget,card=btn.closest('.lesson-card'),ans=card.dataset.answer,ok=btn.dataset.option===ans;speakStory(btn.dataset.option);btn.classList.add(ok?'correct':'wrong');card.querySelectorAll('.lesson-option').forEach(x=>x.disabled=true);card.querySelector('.feedback').textContent=ok?'Correct.':'Good try. The answer was '+ans+'.';const v=(s.currentChapter.targetVocab||[]).find(x=>ans===x.thai||ans===x.meaning);if(v)markVocabAnswer(s.vocabRecords,v.thai,ok,s.chapter);s.xp+=ok?5:1;persistProgress(s);updateStats()}
  async function voiceAnswer(e){const fb=e.currentTarget.parentElement.querySelector('.feedback');fb.textContent='Listening...';try{const r=scoreSpokenChoice(e.currentTarget.dataset.voiceAnswer,await listenThaiOnce());fb.textContent=r.message;if(r.ok)s.xp+=6;persistProgress(s);updateStats()}catch(err){fb.textContent=err.message}}

  function shadow(c){if(!supportsSpeechPractice())return'';const lines=(c.scenes||[]).flatMap(x=>[x.narration,...(x.dialogue||[]).map(d=>d.line)]).filter(Boolean).slice(0,2);return '<section class="lesson-card"><span class="lesson-tag">Shadow</span><h3>Repeat after me</h3>'+lines.map((t,i)=>'<div><button data-speak="'+esc(t)+'">Hear</button> <button data-shadow="'+i+'" data-text="'+esc(t)+'">Repeat</button><p class="feedback" id="shadow-'+i+'"></p></div>').join('')+'</section>'}
  async function doShadow(e){const btn=e.currentTarget,id=btn.dataset.shadow,fb=document.getElementById(id.startsWith('unlock')?'unlock-'+id.split('-')[1]:'shadow-'+id);fb.textContent='Listening...';try{const r=scoreShadowLine(btn.dataset.text,await listenThaiOnce(),difficulty());fb.innerHTML=r.message+'<br>'+renderDiffHtml(r.diff);markSpeechAttempt(s,r.ok);if(r.ok&&id.startsWith('unlock'))s.unlockedScenes++;persistProgress(s);render()}catch(err){fb.textContent=err.message}}

  function speakWords(c){if(!supportsSpeechPractice())return'';return '<section class="lesson-card"><span class="lesson-tag">Speak</span><h3>Practice words</h3>'+((c.targetVocab||[]).map(v=>'<div><strong>'+esc(v.thai)+'</strong> <button data-speak="'+esc(v.thai)+'">Hear</button> <button data-speak-practice="'+esc(v.thai)+'">Speak</button><p class="feedback" id="fb-'+esc(v.thai)+'"></p></div>').join(''))+'</section>'}
  async function practiceWord(e){const thai=e.currentTarget.dataset.speakPractice,fb=document.getElementById('fb-'+thai);fb.textContent='Listening...';try{const r=scoreThaiSpeech(thai,await listenThaiOnce());fb.innerHTML=r.message+'<br>'+renderDiffHtml(r.diff);markSpeechAttempt(s,r.ok);if(r.ok){s.xp+=8;markVocabAnswer(s.vocabRecords,thai,true,s.chapter)}persistProgress(s);updateStats()}catch(err){fb.textContent=err.message}}

  function boss(c){if(!isBoss())return'';const vocab=(c.targetVocab||[]).slice(0,3);const line=((c.scenes||[])[0]&&(((c.scenes[0].dialogue||[])[0]&&c.scenes[0].dialogue[0].line)||c.scenes[0].narration))||collect(c);return '<section class="lesson-card"><span class="lesson-tag">Boss</span><h3>The Guardian only understands Thai!</h3><p>Win 3 stars to pass.</p><div>Stars: <span id="bossScore">'+(s.bossScore||0)+'</span>/3</div>'+vocab.map(v=>'<div><button data-boss-word="'+esc(v.meaning||v.thai)+'">Say meaning: '+esc(v.thai)+'</button><p class="feedback"></p></div>').join('')+'<div><button data-speak="'+esc(line)+'">Hear boss line</button> <button data-boss-line="'+esc(line)+'">Shadow boss line</button><p class="feedback" id="bossLineFb"></p></div></section>'}
  async function bossWord(e){const fb=e.currentTarget.parentElement.querySelector('.feedback');fb.textContent='Listening...';try{const r=scoreSpokenChoice(e.currentTarget.dataset.bossWord,await listenThaiOnce());fb.textContent=r.message;if(r.ok){s.bossScore=Math.min(3,(s.bossScore||0)+1);s.xp+=8;document.getElementById('bossScore').textContent=s.bossScore}persistProgress(s);updateStats()}catch(err){fb.textContent=err.message}}
  async function bossLine(e){const fb=document.getElementById('bossLineFb');fb.textContent='Listening...';try{const r=scoreShadowLine(e.currentTarget.dataset.bossLine,await listenThaiOnce(),difficulty()+.05);fb.innerHTML=r.message+'<br>'+renderDiffHtml(r.diff);if(r.ok){s.bossScore=Math.min(3,(s.bossScore||0)+1);s.xp+=12;document.getElementById('bossScore').textContent=s.bossScore}persistProgress(s);updateStats()}catch(err){fb.textContent=err.message}}

  function nextChapter(){clearChapterCheckpoint();s.chapter++;s.xp+=isBoss()?25:10;s.currentChapter=null;persistProgress(s);updateStats();load()}
  function resetAll(){['tq_current_chapter_json','tq_checkpoint_chapter','tq_unlocked_scenes','tq_boss_score','tq_chapter','tq_xp','tq_story_summary','tq_vocab_records','tq_vocab','tq_speech_streak','tq_best_speech_streak','tq_kid_name','tq_interests'].forEach(k=>localStorage.removeItem(k));clearChapterCheckpoint();stopAudio();location.reload()}
  function vocabTray(c){const items=[...(c.targetVocab||[]),...(c.reviewVocab||[]).map(t=>s.vocabRecords.get(t)).filter(Boolean)];return items.length?'<section class="vocab-tray"><strong>Words</strong>'+items.map(v=>'<div class="vocab-row"><button class="thai-token" data-speak="'+esc(v.thai)+'">'+esc(v.thai)+'</button><span class="vocab-meaning">'+esc(v.meaning||'')+'</span></div>').join('')+'</section>':''}
  function markThai(text){let h=esc(text);for(const v of[...s.vocabRecords.values(),...(s.currentChapter?.targetVocab||[])])if(v&&v.thai)h=h.split(esc(v.thai)).join('<button class="thai-token" data-speak="'+esc(v.thai)+'">'+esc(v.thai)+'</button>');return h}
  function collect(c){return[c.title,...(c.scenes||[]).flatMap(x=>[x.narration,...(x.dialogue||[]).map(d=>d.line)])].filter(Boolean).join(' ')}
  function updateStats(){$('#statChapter').textContent=s.chapter;$('#statWords').textContent=s.vocabRecords.size;$('#statXP').textContent=s.xp}
  function esc(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
}
