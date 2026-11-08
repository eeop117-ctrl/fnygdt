const SUPABASE_URL="https://aoncvlrojdhzjcjfyufs.supabase.co";
const SUPABASE_KEY="sb_publishable_n3p8g5awFygvjPPZ7kq5qA_2w2fJwnj";
const supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
let user=null, tracks=[], currentIndex=-1;

function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(msg,type=""){const d=document.createElement("div");d.className="toast "+type;d.textContent=msg;$("#toastRoot").appendChild(d);setTimeout(()=>d.remove(),3500)}
function fmtTime(sec){if(!isFinite(sec))return"0:00";return Math.floor(sec/60)+":"+String(Math.floor(sec%60)).padStart(2,"0")}
function showPage(name){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$("#page-"+name)?.classList.add("active");document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===name));$("#pageTitle").textContent={feed:"Лента",wave:"Моя волна",saved:"Сохранённое",publish:"Опубликовать",profile:"Профиль"}[name]||"DEMUSICAL";if(name==="feed")loadFeed();if(name==="wave")loadWave();if(name==="saved")loadSaved();if(name==="profile")loadProfile()}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll("[data-page-jump]").forEach(b=>b.onclick=()=>showPage(b.dataset.pageJump));

function trackHTML(t,i){
 const title=escapeHTML(t.title||"Без названия"),artist=escapeHTML(t.artist||"Неизвестный автор"),desc=escapeHTML(t.description||"");
 const cover=t.cover_url?`<img class="cover" src="${escapeHTML(t.cover_url)}" alt="">`:`<div class="cover">♫</div>`;
 return `<article class="track">
   ${cover}
   <div class="track-main"><div class="track-title">${title}</div><div class="track-artist">${artist}</div>${desc?`<div class="track-desc">${desc}</div>`:""}</div>
   <div class="track-actions">
    <button class="icon-btn" title="Слушать" onclick="playTrack(${i})">▶</button>
    <button class="icon-btn" title="Сохранить" onclick="saveTrack('${escapeHTML(t.id)}')">♡</button>
   </div>
 </article>`
}
function renderTracks(box,list){box.innerHTML=list.length?list.map((t,i)=>trackHTML(t,i)).join(""):`<div class="empty">Пока здесь пусто.<br><small>Опубликуй первый трек в DEMUSICAL.</small></div>`}

async function loadFeed(){
 const box=$("#feedList");box.innerHTML=`<div class="loading"><div class="spinner"></div>Загружаем ленту...</div>`;
 const {data,error}=await supabase.from("tracks").select("*").order("created_at",{ascending:false}).limit(60);
 if(error){console.error(error);box.innerHTML=`<div class="empty"><b>Не удалось загрузить ленту</b><br><small>${escapeHTML(error.message)}<br>Код: ${escapeHTML(error.code||"—")}</small></div>`;return}
 tracks=data||[];renderTracks(box,tracks)
}
async function loadWave(){
 const box=$("#waveList");box.innerHTML=`<div class="loading"><div class="spinner"></div>Собираем волну...</div>`;
 const {data,error}=await supabase.from("tracks").select("*").order("created_at",{ascending:false}).limit(60);
 if(error){box.innerHTML=`<div class="empty">${escapeHTML(error.message)}</div>`;return}
 tracks=data||[];renderTracks(box,tracks)
}
async function loadSaved(){
 const box=$("#savedList");box.innerHTML=`<div class="loading"><div class="spinner"></div>Загружаем сохранённое...</div>`;
 const {data,error}=await supabase.from("saved_tracks").select("track_id,tracks(*)").eq("user_id",user.id).order("created_at",{ascending:false});
 if(error){console.error(error);box.innerHTML=`<div class="empty"><b>Не удалось загрузить сохранённое</b><br><small>${escapeHTML(error.message)}</small></div>`;return}
 const saved=(data||[]).map(x=>x.tracks).filter(Boolean);tracks=saved;renderTracks(box,saved)
}
async function saveTrack(id){
 if(!user)return;
 const {error}=await supabase.from("saved_tracks").upsert({user_id:user.id,track_id:id},{onConflict:"user_id,track_id"});
 if(error)toast(error.message,"err");else toast("Трек сохранён","ok")
}

function playTrack(i){
 const t=tracks[i];if(!t?.audio_url)return toast("У трека нет аудиофайла","err");
 currentIndex=i;const p=$("#audioPlayer");p.src=t.audio_url;p.play().catch(()=>{});$("#playerBar").classList.remove("hidden");
 $("#nowTitle").textContent=t.title||"Без названия";$("#nowArtist").textContent=t.artist||"Неизвестный автор";
 $("#nowCover").innerHTML=t.cover_url?`<img src="${escapeHTML(t.cover_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:13px">`:"♫";
 $("#playBtn").textContent="❚❚"
}
$("#playBtn").onclick=()=>{const p=$("#audioPlayer");if(p.paused){p.play();$("#playBtn").textContent="❚❚"}else{p.pause();$("#playBtn").textContent="▶"}};
$("#nextBtn").onclick=()=>{if(tracks.length)playTrack((currentIndex+1)%tracks.length)};
$("#prevBtn").onclick=()=>{if(tracks.length)playTrack((currentIndex-1+tracks.length)%tracks.length)};
$("#audioPlayer").ontimeupdate=()=>{const p=$("#audioPlayer");$("#seekBar").value=p.duration?(p.currentTime/p.duration*100):0;$("#timeCurrent").textContent=fmtTime(p.currentTime);$("#timeTotal").textContent=fmtTime(p.duration)};
$("#audioPlayer").onended=()=>{if(tracks.length)playTrack((currentIndex+1)%tracks.length)};
$("#seekBar").oninput=e=>{const p=$("#audioPlayer");if(p.duration)p.currentTime=p.duration*(e.target.value/100)};
$("#muteBtn").onclick=()=>{$("#audioPlayer").muted=!$("#audioPlayer").muted;$("#muteBtn").textContent=$("#audioPlayer").muted?"◉":"◖"};

$("#searchInput").oninput=async e=>{
 const q=e.target.value.trim().toLowerCase();if(!q)return loadFeed();
 const {data,error}=await supabase.from("tracks").select("*").or(`title.ilike.%${q}%,artist.ilike.%${q}%,description.ilike.%${q}%`).order("created_at",{ascending:false}).limit(60);
 if(error){toast(error.message,"err");return}tracks=data||[];renderTracks($("#feedList"),tracks);showPage("feed")
};

$("#publishForm").onsubmit=async e=>{
 e.preventDefault();if(!user)return toast("Нужен вход через Discord","err");
 const audio=$("#audioInput").files[0],cover=$("#coverInput").files[0];if(!audio)return;
 const btn=$("#publishBtn"),status=$("#uploadStatus");btn.disabled=true;status.textContent="Загрузка аудио...";
 try{
   const audioExt=(audio.name.split(".").pop()||"mp3").toLowerCase(),audioPath=`${user.id}/${crypto.randomUUID()}.${audioExt}`;
   let r=await supabase.storage.from("audio").upload(audioPath,audio,{cacheControl:"3600",upsert:false});if(r.error)throw r.error;
   let coverUrl=null;
   if(cover){status.textContent="Загрузка обложки...";const ext=(cover.name.split(".").pop()||"jpg").toLowerCase(),path=`${user.id}/${crypto.randomUUID()}.${ext}`;r=await supabase.storage.from("covers").upload(path,cover,{cacheControl:"3600",upsert:false});if(r.error)throw r.error;coverUrl=supabase.storage.from("covers").getPublicUrl(path).data.publicUrl}
   status.textContent="Сохраняем публикацию...";
   const audioUrl=supabase.storage.from("audio").getPublicUrl(audioPath).data.publicUrl;
   const {error}=await supabase.from("tracks").insert({user_id:user.id,title:$("#titleInput").value.trim(),artist:$("#artistInput").value.trim()||user.user_metadata?.full_name||"Автор",description:$("#descriptionInput").value.trim(),audio_url:audioUrl,cover_url:coverUrl});
   if(error)throw error;
   $("#publishForm").reset();$("#audioName").textContent="Нажми, чтобы выбрать";$("#coverName").textContent="PNG / JPG / WEBP";status.textContent="Готово!";toast("Трек опубликован","ok");showPage("feed")
 }catch(err){console.error(err);status.textContent="Ошибка: "+err.message;toast(err.message,"err")}finally{btn.disabled=false}
};
$("#audioInput").onchange=e=>$("#audioName").textContent=e.target.files[0]?.name||"Нажми, чтобы выбрать";
$("#coverInput").onchange=e=>$("#coverName").textContent=e.target.files[0]?.name||"PNG / JPG / WEBP";

async function loadProfile(){
 const {data}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 const m=user.user_metadata||{};const name=data?.display_name||m.full_name||m.name||user.email?.split("@")[0]||"Пользователь";
 $("#profileName").textContent=name;$("#profileEmail").textContent=user.email||"Discord";
 $("#displayNameInput").value=data?.display_name||name;$("#avatarUrlInput").value=data?.avatar_url||"";$("#bannerUrlInput").value=data?.banner_url||"";
 $("#profileAvatar").innerHTML=data?.avatar_url?`<img src="${escapeHTML(data.avatar_url)}" alt="">`:escapeHTML(name[0]?.toUpperCase()||"D");
 $("#profileBanner").style.backgroundImage=data?.banner_url?`url("${data.banner_url}")`:"";
}
$("#saveProfileBtn").onclick=async()=>{
 const payload={id:user.id,display_name:$("#displayNameInput").value.trim(),avatar_url:$("#avatarUrlInput").value.trim()||null,banner_url:$("#bannerUrlInput").value.trim()||null};
 const {error}=await supabase.from("profiles").upsert(payload,{onConflict:"id"});if(error)toast(error.message,"err");else{toast("Профиль сохранён","ok");loadProfile()}
};

function showLoginGate(){ $("#loginGate").classList.remove("hidden"); }
$("#discordBtn").onclick=async()=>{
 const redirectTo=window.location.origin+window.location.pathname;
 const {data,error}=await supabase.auth.signInWithOAuth({provider:"discord",options:{redirectTo}});
 if(error){$("#authError").textContent=error.message;return}
 if(data?.url)window.location.assign(data.url);
};
$("#logoutBtn").onclick=()=>supabase.auth.signOut();

async function boot(){
 const {data}=await supabase.auth.getSession();user=data.session?.user||null;
 if(!user){showLoginGate();return}
 $("#loginGate").classList.add("hidden");$("#userChip").textContent=user.user_metadata?.full_name||user.email||"Discord";
 await supabase.from("profiles").upsert({id:user.id,display_name:user.user_metadata?.full_name||user.user_metadata?.name||"Пользователь"},{onConflict:"id"});
 loadFeed();
}
supabase.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;if(user){$("#loginGate").classList.add("hidden");$("#userChip").textContent=user.user_metadata?.full_name||user.email||"Discord";loadFeed()}else showLoginGate()});
$("#themeBtn").onclick=()=>{document.body.classList.toggle("light");toast("Тема переключена")};
boot();
