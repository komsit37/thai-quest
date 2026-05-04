export function speakThai(text){speak(text,'th-TH',0.78)}
export function speakStory(text){speak(text,'en-US',0.86)}
export function stopAudio(){if(window.speechSynthesis)window.speechSynthesis.cancel()}
export function wireAudioDelegation(root){(root||document).addEventListener('click',function(e){var t=e.target.closest('[data-speak]');if(!t)return;speakThai(t.dataset.speak)})}
function speak(text,lang,rate){if(!window.speechSynthesis||!text)return;var u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=rate;u.pitch=1.04;var v=pickVoice(lang);if(v)u.voice=v;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}
function pickVoice(lang){var voices=window.speechSynthesis.getVoices()||[];var base=lang.split('-')[0];var preferred=['Samantha','Daniel','Karen','Moira','Microsoft Jenny','Microsoft Aria','Google US English','Google UK English Female','Kanya','Narisa'];return voices.find(v=>preferred.some(n=>v.name.includes(n))&&v.lang.startsWith(base))||voices.find(v=>v.lang===lang&&!v.name.toLowerCase().includes('compact'))||voices.find(v=>v.lang&&v.lang.startsWith(base))||null}
if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=function(){};
