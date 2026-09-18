/* ============================================================
   chatbot.js  –  SerenityBot personalised conversation engine
   Adapts tone, vocabulary and responses based on:
     • gender  (female / male / other)
     • role    (student / staff / worker / other)
     • ageGroup (child / teen / young / adult / senior)
   No harsh words. Women get a warm, safe, nurturing tone.
   Children get simple, playful, caring language.
   ============================================================ */

const ChatBot = (() => {

  /* ── Active user profile (set by App after login) ───────── */
  let profile = { name: '', gender: 'other', role: 'other', ageGroup: 'adult' };

  function setProfile(p) {
    profile = {
      name:     p.name     || '',
      gender:   p.gender   || 'other',
      role:     p.role     || 'other',
      ageGroup: p.ageGroup || 'adult',
    };
  }

  /* ── Friendly name helper ────────────────────────────────── */
  function dear() {
    const { gender, ageGroup, name } = profile;
    if (ageGroup === 'child')  return name ? name : 'little one';
    if (ageGroup === 'teen')   return name ? name : 'friend';
    if (gender   === 'female') return name ? name : 'dear';
    return name ? name : 'friend';
  }

  /* ── Pick one response at random ─────────────────────────── */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ── Tone helper — returns a tone tag ───────────────────── */
  function tone() {
    const { gender, ageGroup } = profile;
    if (ageGroup === 'child')  return 'child';
    if (ageGroup === 'teen')   return 'teen';
    if (gender   === 'female') return 'female';
    return 'neutral';
  }

  /* ══════════════════════════════════════════════════════════
     INTENT RESPONSE BANKS
     Each intent has tone-keyed responses:
       female  → warm, safe, nurturing, validating
       child   → simple, gentle, playful, caring like a kind parent
       teen    → relatable, non-preachy, supportive
       neutral → calm, grounded, supportive for all others
     Role-specific lines are woven in via role() calls.
  ═══════════════════════════════════════════════════════════ */

  const responses = {

    /* ── Anxiety ─────────────────────────────────────────── */
    anxious: {
      female: [
        (d) => `Oh ${d}, I can hear how unsettled you feel right now, and I want you to know — you are completely safe here with me. 🌸 Take a slow breath. What's been making your heart feel heavy?`,
        (d) => `Anxiety can feel like a storm inside, ${d}. But storms always pass. You are so much stronger than this feeling. Can you tell me what triggered it? I'm listening with all my heart. 💜`,
        (d) => `${d}, your feelings are so valid. I'm right here, and nothing you say will surprise or upset me. This is your safe space. Let's breathe through this together, okay? 🌿`,
      ],
      child: [
        (d) => `Aww ${d}, it's okay to feel a little scared sometimes — even grown-ups feel that way! 🌈 Can you tell me what's making your tummy feel funny? I'm right here with you.`,
        (d) => `Hey ${d}! 🐻 Did you know that when you feel worried, taking 3 big slow breaths can make it a little better? Breathe in like you're smelling flowers… and out like you're blowing bubbles. Try it with me! 🫧`,
      ],
      teen: [
        (d) => `${d}, anxiety is genuinely exhausting — and it's way more common than people admit. You're not overreacting at all. What's going on? 💙`,
        (d) => `That anxious feeling is so real, ${d}. Your brain is just trying (a bit too hard) to protect you. Let's try grounding — name 5 things you can see right now. It actually works. 🌿`,
      ],
      neutral: [
        (d) => `I hear you, ${d}. Anxiety has a way of making everything feel bigger than it is. Let's take this one breath at a time — what's weighing on you? 💙`,
        (d) => `You're not alone in this, ${d}. Anxiety affects so many people. Try this: name **5 things you can see**, 4 you can touch, 3 you can hear. It brings you back to the present. 🌿`,
      ],
    },

    /* ── Overwhelmed ─────────────────────────────────────── */
    overwhelmed: {
      female: [
        (d) => `${d}, sweet one — you've been carrying so much. It's okay to put some of that down right now. You don't have to hold everything all at once. What feels the heaviest today? 🌸`,
        (d) => `You are allowed to feel overwhelmed, ${d}. That's not weakness — that's you being human. I'm here. Let's take things one tiny step at a time, together. 💜`,
      ],
      child: [
        (d) => `${d}, when everything feels like too much, it's okay to take a little break! 🌈 Even superheroes rest. What's one small thing we can do to make you feel a bit better right now?`,
      ],
      teen: [
        (d) => `${d}, when everything piles up it can feel like you're drowning. You're not — you're just carrying too much at once. What's the biggest thing stressing you out right now? Let's talk about it. 💙`,
      ],
      neutral: [
        (d) => `Feeling overwhelmed means you've been carrying a lot, ${d}. 🌊 It's okay to set some of that weight down. What feels heaviest right now?`,
        (d) => `Even small steps matter, ${d}. Let's break things down — what's the one thing pressing on you most right now? 💚`,
      ],
    },

    /* ── Sadness ─────────────────────────────────────────── */
    sad: {
      female: [
        (d) => `${d}, I'm so glad you told me. You don't have to hold your sadness alone — I'm right here beside you. 💜 Would you like to talk about what happened, or would you just like some company right now?`,
        (d) => `It's completely okay to feel sad, ${d}. Your feelings deserve to be heard, not pushed away. I'm listening with a warm, open heart. What's brought this on? 🌸`,
        (d) => `Some days are just heavy, ${d}, and that's allowed. Be so gentle with yourself today. Even little things — a warm drink, a soft blanket — can help. You deserve comfort. 🌷`,
      ],
      child: [
        (d) => `Oh ${d}, I'm sorry you're feeling sad. 🐣 It's totally okay to feel that way. Even the sun has cloudy days! Can you tell me what made you feel this way? I really want to help.`,
      ],
      teen: [
        (d) => `${d}, sadness is real and it deserves space. You're not being dramatic — how you feel matters. What's going on? I'm all ears, no judgement. 💙`,
      ],
      neutral: [
        (d) => `I'm truly sorry you're feeling this way, ${d}. 💜 Sadness is heavy, but you don't have to carry it alone. I'm here. What's going on?`,
        (d) => `Some days are just hard, ${d}, and that's valid. Be gentle with yourself today. Is there anything small that's brought you a little comfort recently? 🌤️`,
      ],
    },

    /* ── Anger / Frustration ─────────────────────────────── */
    angry: {
      female: [
        (d) => `${d}, I hear you — and I want you to know, your feelings make complete sense. It's okay to feel this way. You're safe to say exactly how you feel here. What happened? 💜`,
        (d) => `Feeling frustrated or upset doesn't make you anything other than human, ${d}. 🌸 Take a slow breath with me, and then let's talk about what's going on. I'm not going anywhere.`,
      ],
      child: [
        (d) => `${d}, it's okay to feel cross sometimes! 🦁 Even the kindest people feel that way. Can you take a big deep breath with me? In… and out… Good job! Now, what made you feel this way?`,
      ],
      teen: [
        (d) => `That frustration is completely valid, ${d}. Something clearly isn't right and you know it. What happened? 💙`,
      ],
      neutral: [
        (d) => `Your feelings are completely valid, ${d}. Frustration usually means something matters deeply to you. What's been building up? 🌿`,
        (d) => `It sounds like you've hit a wall, ${d}. That's so understandable. Let's take a couple of slow breaths first, and then you can tell me everything. Ready? 🌬️`,
      ],
    },

    /* ── Sleep ───────────────────────────────────────────── */
    sleep: {
      female: [
        (d) => `${d}, not being able to sleep is so draining — your body and heart need that rest. 🌙 Have you tried the 4-7-8 breathing before bed? It's very gentle and it really does help. 🌸`,
        (d) => `Sleep troubles often happen when our minds won't switch off, ${d}. Before bed, try writing down everything on your mind — it's like telling your brain it's safe to let go. 📝💜`,
      ],
      child: [
        (d) => `${d}, having trouble sleeping? 🌙 Try this cosy trick — imagine you're floating on a fluffy cloud in the sky. Close your eyes and picture it. What colour is your cloud? 🌤️`,
      ],
      teen: [
        (d) => `Sleep is so underrated, ${d}. When your brain won't quiet down, try putting your phone away 30 mins before bed — I know, easier said than done, but it really makes a difference. 😴💙`,
      ],
      neutral: [
        (d) => `Sleep struggles are so draining, ${d}. Have you tried the 4-7-8 breathing technique before bed? It genuinely helps calm the nervous system. 😴`,
        (d) => `When the mind won't quiet down at night, ${d}, try writing your worries down first — it 'offloads' them from your brain so you can rest. 📝`,
      ],
    },

    /* ── Loneliness ──────────────────────────────────────── */
    lonely: {
      female: [
        (d) => `${d}, I want you to know — you are not alone right now. I am here with you, and I genuinely care about how you feel. 💜 You are seen, and you matter so much.`,
        (d) => `Loneliness can feel so hollow, ${d}. Thank you for reaching out — that took courage. Is there one person you could send a little message to today, just to feel a little connected? 🌸`,
      ],
      child: [
        (d) => `${d}, I'm right here with you! 🤗 You are never really alone — I care about you. Can you think of one person, maybe a friend or family member, you'd like to talk to today?`,
      ],
      teen: [
        (d) => `${d}, feeling left out or disconnected is genuinely painful. It doesn't mean anything is wrong with you — it just means you deserve better connection. I'm here. 💙`,
      ],
      neutral: [
        (d) => `You matter, ${d}, and you're not truly alone right now — I'm right here with you. 💙 Is there one person in your life you could reach out to today, even briefly?`,
      ],
    },

    /* ── Stress ───────────────────────────────────────────── */
    stressed: {
      female: [
        (d) => `${d}, your body is telling you it needs a little care right now. 🌸 You give so much to everyone around you — it's okay to give some of that kindness back to yourself. What's been putting pressure on you?`,
        (d) => `Stress has a way of making everything feel urgent all at once, ${d}. Let's slow down for a moment. Take one gentle breath with me. Now — what is the one thing that feels most heavy right now? 💜`,
      ],
      child: [
        (d) => `${d}, it sounds like you have a lot going on! 🌈 Even a short break — drawing, listening to music, or going outside for a bit — can help your brain feel better. What do you enjoy doing?`,
      ],
      teen: [
        (d) => `${d}, the pressure teens face today is very real and often underestimated. You're not being soft — you're dealing with a lot. What's stressing you out most right now? 💙`,
      ],
      neutral: [
        (d) => `Stress is your body's signal that it needs support, ${d}. Let's give it some. 🌿 What's creating the most pressure in your life right now?`,
        (d) => `Even 5 minutes of mindful breathing can make a difference, ${d}. Want to try the breathing exercise together? 🌬️`,
      ],
    },

    /* ── Role: study/exam/school ─────────────────────────── */
    study: {
      female: [
        (d) => `${d}, study pressure can feel so relentless — especially when you're trying your very best. 📚 Please remember: your worth is not measured by any grade or result. How are you holding up? 🌸`,
        (d) => `Learning is a journey, not a race, ${d}. 💜 Be kind to yourself. What's coming up that's been making you feel this way?`,
      ],
      child: [
        (d) => `${d}, school can feel really tricky sometimes! 📖 But you know what? Making mistakes is how we learn — even the greatest scientists got things wrong at first. What subject feels hard right now?`,
      ],
      teen: [
        (d) => `${d}, exam pressure is so real and nobody talks about it enough. You're not alone in feeling this. What's coming up? Let's think through it together. 💙`,
      ],
      neutral: [
        (d) => `Study and exam pressure can really build up, ${d}. 📚 Break things into smaller steps — even 20 focused minutes is progress. What's weighing on you most right now?`,
        (d) => `Your wellbeing comes before any result, ${d}. A clear, rested mind always performs better than an exhausted one. Have you been getting any breaks? 💚`,
      ],
    },

    /* ── Role: work/job ──────────────────────────────────── */
    work: {
      female: [
        (d) => `${d}, workplace pressure can be so draining — especially when you feel like you have to hold everything together. 💜 You deserve support too. What's been going on at work?`,
        (d) => `${d}, it's so important that your workplace feels safe and respectful. If something doesn't feel right, your feelings about it are completely valid. Would you like to talk it through? 🌸`,
      ],
      child: [
        (d) => `${d}, is there something at school or at home that feels like a lot of work? 🌟 Tell me about it — maybe we can find a way to make it easier together!`,
      ],
      teen: [
        (d) => `Balancing school, maybe a part-time job, and life in general is genuinely tough, ${d}. Don't let anyone tell you otherwise. What's making work feel difficult right now? 💙`,
      ],
      neutral: [
        (d) => `Work stress is one of the biggest sources of pressure these days, ${d}. 💼 What's the main challenge — the workload, the people, or something else?`,
        (d) => `Your wellbeing always comes before your job, ${d}. Remember — you are so much more than what you produce. What's been happening? 💚`,
      ],
    },

    /* ── Relationships ───────────────────────────────────── */
    relationship: {
      female: [
        (d) => `${d}, relationships can touch the deepest parts of us. Whatever you're going through, you deserve to be treated with kindness and respect — always. 💜 Would you like to talk about it?`,
        (d) => `${d}, your feelings about this are completely valid. You deserve warmth, care, and safety in every relationship in your life. I'm here to listen — what happened? 🌸`,
      ],
      child: [
        (d) => `${d}, did something happen with a friend or someone at home? 🤗 It's okay — friendships can be tricky sometimes. Tell me what happened and we'll figure it out together.`,
      ],
      teen: [
        (d) => `Relationship stuff — whether it's friends, family, or someone you care about — can be really intense, ${d}. Whatever's going on, you deserve people who treat you well. What happened? 💙`,
      ],
      neutral: [
        (d) => `Relationship stress is so close to the heart, ${d}. 💜 It's okay to feel hurt. Do you want to talk through what's going on?`,
        (d) => `Conflicts with people we care about take real emotional energy, ${d}. You clearly care — that's a strength. What's happening? 🌿`,
      ],
    },

    /* ── Breathing / Calm request ────────────────────────── */
    breathing: {
      female: [
        (d) => `Yes, ${d} — let's breathe together. 🌸 Place one hand gently on your chest. Breathe in softly for 4 counts… hold for 4… and slowly breathe out for 6. You are safe. You are okay. 💜`,
        (d) => `${d}, the Breathing tab has a beautiful guided exercise waiting for you. 🌬️ Or right now: breathe in like you're gently lifting a feather… and out like you're softly blowing a candle. How does that feel?`,
      ],
      child: [
        (d) => `${d}, let's do a fun breathing exercise! 🫧 Pretend you're blowing up a big balloon — breathe in slowly through your nose, then blow out slowly through your mouth. Let's do it 3 times together! Ready? 🎈`,
      ],
      teen: [
        (d) => `${d}, box breathing actually works — try it: 4 counts in, 4 hold, 4 out, 4 hold. Repeat 4 times. It's what athletes use to calm down fast. 💙 Want the guided version in the Breathing tab?`,
      ],
      neutral: [
        (d) => `Great idea, ${d}! 🌬️ Head over to the **Breathing** tab for a guided exercise, or try this now: in for 4 counts, hold for 4, out for 4.`,
        (d) => `Let's breathe, ${d}. In slowly through the nose… hold gently… and out through the mouth. Even one round can shift how you feel. 🌿`,
      ],
    },

    /* ── Greetings ───────────────────────────────────────── */
    hello: {
      female: [
        (d) => `Hello ${d}! 🌸 It's so lovely to see you here. This is your safe, peaceful space — you can talk to me about absolutely anything. How are you feeling today, sweetheart?`,
        (d) => `Hi ${d}! 💜 Welcome — I'm so glad you came. I'm here to listen, support, and care for you. How is your heart today?`,
      ],
      child: [
        (d) => `Hi ${d}!! 🌈🎉 I'm SerenityBot and I'm SO happy you're here! How are you feeling today? You can tell me anything — I promise I'm a really good listener! 🐻`,
      ],
      teen: [
        (d) => `Hey ${d}! 👋 Glad you're here. This is a no-judgement zone — say whatever's on your mind. How are you doing? 💙`,
      ],
      neutral: [
        (d) => `Hello ${d}! 🌿 Welcome to SerenityBot. I'm here to listen and help you feel a little calmer. How are you doing today?`,
        (d) => `Hi there, ${d}! 💙 This is a safe space — how are you feeling right now?`,
      ],
    },

    /* ── Doing okay ──────────────────────────────────────── */
    okay: {
      female: [
        (d) => `I'm really glad to hear that, ${d}. 🌸 Even on okay days, it's worth checking in with yourself. Is there anything on your mind, or anything I can do to make your day even a little brighter?`,
      ],
      child: [
        (d) => `Yay, ${d}! 🌟 That makes me happy to hear! Is there anything fun you'd like to talk about today?`,
      ],
      teen: [
        (d) => `Good to hear, ${d}! Sometimes okay is genuinely enough. Anything on your mind, or just stopping by? Either is fine. 💙`,
      ],
      neutral: [
        (d) => `That's good to hear, ${d}! 🌿 Even on okay days, a little check-in with yourself goes a long way. Is there anything on your mind?`,
        (d) => `Glad you're doing okay, ${d}! 😊 Sometimes that's plenty. I'm here if anything comes up.`,
      ],
    },

    /* ── Thank you ───────────────────────────────────────── */
    thanks: {
      female: [
        (d) => `${d}, that truly means the world to me. 🌸 You did the brave thing by opening up — never forget that. Come back whenever you need a warm, safe place to land. 💜`,
        (d) => `You are so welcome, ${d}. You deserve every bit of kindness and care. I'll always be right here for you. 🌷`,
      ],
      child: [
        (d) => `Aww ${d}, that makes me SO happy! 🌟 You did such a great job today. Remember — I'm always here whenever you need a friend! 🐻💛`,
      ],
      teen: [
        (d) => `Really glad I could help, ${d}. You took a good step today just by talking about it. Come back anytime — I'm always here. 💙`,
      ],
      neutral: [
        (d) => `So glad I could help, ${d}. 🌿 You did the important part — you showed up and talked about it. Come back anytime. 💙`,
        (d) => `You're very welcome, ${d}. Taking care of your mind takes real courage. Keep going — you've got this. ✨`,
      ],
    },

    /* ── Affirmation request ─────────────────────────────── */
    affirmation: {
      female: [
        (d) => `${d}, here's one just for you: 🌸 *"You are enough. Not because of what you do, but simply because of who you are."* Head to the Affirmations tab for more beautiful ones. 💜`,
        (d) => `💜 *"You deserve gentleness — especially from yourself, ${d}."* The Affirmations section has a whole collection of warm words waiting for you. 🌷`,
      ],
      child: [
        (d) => `${d}, here's a special one for you: ⭐ *"You are kind, you are brave, and you are loved — just as you are!"* Head to the Affirmations tab for more! 🌈`,
      ],
      teen: [
        (d) => `${d}: ✨ *"You don't have to have it all figured out. Growing is the point."* Check the Affirmations tab for more. 💙`,
      ],
      neutral: [
        (d) => `Here's one for you, ${d}: ✨ *"You are braver than you believe, stronger than you seem, and smarter than you think."* Head to the Affirmations tab for more! 🌿`,
      ],
    },

    /* ── Tips / Coping ───────────────────────────────────── */
    tips: {
      female: [
        (d) => `${d}, here are some gentle ways to care for yourself today: 🌸\n• **Breathe** – the 4-7-8 technique is wonderfully calming\n• **Rest** – even 10 quiet minutes counts\n• **Write** – pour your feelings onto paper\n• **Be kind to yourself** – you deserve the same care you give others\nWhich one feels right for you right now? 💜`,
      ],
      child: [
        (d) => `${d}, here are some fun ways to feel better: 🌈\n• 🎨 Draw or colour something you love\n• 🚶 Go outside for a little walk\n• 🎵 Listen to your favourite song\n• 🤗 Give someone you love a hug\nWhich one do you want to try? 🌟`,
      ],
      teen: [
        (d) => `${d}, real coping tools that actually work:\n💙 Deep breathing resets your nervous system\n🚶 A short walk genuinely boosts your mood\n📵 Even 30 mins without your phone helps\n📝 Writing it down gets it out of your head\nWant to try any of these? 💙`,
      ],
      neutral: [
        (d) => `Here are some effective stress-relief tools, ${d}: 🌿\n• **Breathe** – try the 4-7-8 technique\n• **Move** – even a 5-minute walk helps\n• **Write** – journal your feelings\n• **Rest** – sleep is non-negotiable\nWhich would you like to explore? 💙`,
      ],
    },
  };

  /* ══════════════════════════════════════════════════════════
     ROLE-SPECIFIC EXTRAS
     Extra responses injected when role matches the intent.
  ═══════════════════════════════════════════════════════════ */
  const roleExtras = {
    student: {
      stressed: [
        (d) => `${d}, student life comes with so much pressure that often goes unseen. Exams, assignments, social life, future worries — it all adds up. But right now, in this moment, you are doing okay. 💙 What's weighing on you most?`,
        (d) => `${d}, remember: your grades do not define your value as a person. You are so much more than any result. 📚 What's stressing you about your studies right now?`,
      ],
      sleep: [
        (d) => `Late-night studying can really disrupt your sleep, ${d}. Try stopping screens 30 minutes before bed — even just resting is better than pushing through exhausted. 😴`,
      ],
    },
    staff: {
      stressed: [
        (d) => `${d}, supporting others every day takes a quiet kind of strength that often goes unnoticed. Please remember — you deserve support too. 💙 What's been happening at work?`,
        (d) => `Staff and educators carry so much responsibility, ${d}. Burnout is real, and your wellbeing matters just as much as those you care for. How are you holding up? 🌿`,
      ],
    },
    worker: {
      stressed: [
        (d) => `${d}, working hard day after day takes real strength. It's okay to feel tired — that's not a sign of weakness, it's a sign you've been giving a lot. What's been going on? 💙`,
        (d) => `The pressures of work can follow you home, ${d}. Have you had any time this week that was just for you? Even a short walk or a quiet cup of tea counts. 🌿`,
      ],
      work: [
        (d) => `${d}, a healthy boundary between your work and your personal time is so important for your wellbeing. Your job is part of your life — not all of it. 💚`,
      ],
    },
  };

  /* ══════════════════════════════════════════════════════════
     FALLBACK RESPONSES  — when no intent matches
  ═══════════════════════════════════════════════════════════ */
  const fallbacks = {
    female: [
      (d) => `${d}, I'm here and I'm listening — really listening. 💜 You can share anything with me. This is your safe space. What's on your heart right now?`,
      (d) => `Thank you for being here, ${d}. Whatever you're carrying, you don't have to carry it alone. I'm right beside you. 🌸`,
      (d) => `${d}, every feeling you have is valid and welcome here. Take your time — I'm not going anywhere. 💜`,
      (d) => `I hear you, ${d}. Sometimes the most healing thing is just knowing someone is truly listening. I am. 🌷 Tell me more when you're ready.`,
    ],
    child: [
      (d) => `${d}, I'm here! 🐻 Can you tell me a little more about how you're feeling? I really want to understand and help you.`,
      (d) => `I'm listening very carefully, ${d}! 🌟 Tell me more — what's going on?`,
    ],
    teen: [
      (d) => `${d}, I'm here — no judgement, no advice you didn't ask for. Just tell me what's going on. 💙`,
      (d) => `That makes sense, ${d}. Can you tell me a bit more? I genuinely want to understand. 💙`,
    ],
    neutral: [
      (d) => `I'm here and I'm listening, ${d}. 💙 Can you tell me a little more about how you're feeling?`,
      (d) => `Thank you for sharing that with me, ${d}. It sounds like you have a lot going on. Would you like to talk more about it? 🌿`,
      (d) => `I hear you, ${d}. Sometimes just expressing what's inside helps lighten the load. What else is on your mind? 🌿`,
      (d) => `Every feeling you have is valid, ${d}. I'm here — keep talking if you'd like. 💜`,
      (d) => `That sounds really tough, ${d}. You're doing the right thing by reaching out. What would feel most helpful right now? 🌿`,
    ],
  };

  let fallbackIndex = 0;

  /* ── Intent keyword map ─────────────────────────────────── */
  const intentMap = [
    { key: 'anxious',      tags: ['anxious','anxiety','nervous','panic','worried','worry','scared','fear','dread','terrified','uneasy'] },
    { key: 'overwhelmed',  tags: ['overwhelmed','overloaded','burnout','burnt out','cant cope','drowning','too much','everything'] },
    { key: 'sad',          tags: ['sad','sadness','depressed','depression','unhappy','miserable','hopeless','empty','numb','crying','cry','tears','grief','upset'] },
    { key: 'angry',        tags: ['angry','anger','frustrated','frustration','furious','mad','annoyed','irritated','rage','cross','upset'] },
    { key: 'sleep',        tags: ['sleep','insomnia','cant sleep','tired','exhausted','no sleep','lying awake','restless','awake at night'] },
    { key: 'lonely',       tags: ['lonely','alone','isolated','no one','nobody','no friends','left out','disconnected','miss'] },
    { key: 'stressed',     tags: ['stress','stressed','pressure','tension','stressful','hectic','chaotic','too busy','no time','overwhelm'] },
    { key: 'study',        tags: ['study','exam','test','assignment','homework','school','college','university','grade','marks','fail','pass'] },
    { key: 'work',         tags: ['work','job','boss','colleague','coworker','office','deadline','meeting','career','fired','quit','salary','manager'] },
    { key: 'relationship', tags: ['relationship','partner','boyfriend','girlfriend','husband','wife','family','parent','friend','breakup','divorce','fight','argument','love'] },
    { key: 'breathing',    tags: ['breathing','breathe','breath','relax','calm','meditate','meditation','mindful','mindfulness','peace','peaceful'] },
    { key: 'hello',        tags: ['hi','hello','hey','morning','afternoon','evening','howdy','hiya','sup','good day'] },
    { key: 'okay',         tags: ['fine','okay','ok','alright','not bad','doing well','pretty good','all good'] },
    { key: 'thanks',       tags: ['thank','thanks','thank you','grateful','appreciate','helpful','helped','better','amazing','wonderful'] },
    { key: 'affirmation',  tags: ['affirmation','positive','quote','motivation','inspire','encouragement','uplift','cheer'] },
    { key: 'tips',         tags: ['tip','tips','advice','technique','trick','strategy','coping','cope','handle','manage','deal'] },
  ];

  /* ── Get personalised response ──────────────────────────── */
  function getResponse(userMessage) {
    const lower = userMessage.toLowerCase().replace(/[^\w\s']/g, ' ');
    const words = lower.split(/\s+/);
    const d     = dear();
    const t     = tone();

    /* Score each intent */
    let bestKey   = null;
    let bestScore = 0;
    for (const intent of intentMap) {
      let score = 0;
      for (const tag of intent.tags) {
        if (lower.includes(tag))                            score += 2;
        if (words.some(w => w === tag || w.startsWith(tag))) score += 1;
      }
      if (score > bestScore) { bestScore = score; bestKey = intent.key; }
    }

    if (bestKey && bestScore >= 2) {
      /* Check if role has an extra response for this intent */
      const rolePool = roleExtras[profile.role]?.[bestKey];
      if (rolePool && Math.random() < 0.4) {
        return pick(rolePool)(d);
      }
      /* Otherwise use tone-specific response bank */
      const bank = responses[bestKey];
      if (bank) {
        const pool = bank[t] || bank.neutral || [];
        if (pool.length) return pick(pool)(d);
      }
    }

    /* Fallback */
    const fPool = fallbacks[t] || fallbacks.neutral;
    const reply = fPool[fallbackIndex % fPool.length](d);
    fallbackIndex++;
    return reply;
  }

  /* ── Render helpers ─────────────────────────────────────── */
  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  function createBubble(text, role, timestamp) {
    const wrap   = document.createElement('div');
    wrap.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className   = 'msg-avatar';
    avatar.textContent = role === 'bot' ? '🌿' : '👤';
    avatar.setAttribute('aria-hidden', 'true');

    const inner  = document.createElement('div');
    inner.style.display        = 'flex';
    inner.style.flexDirection  = 'column';

    const bubble = document.createElement('div');
    bubble.className  = 'msg-bubble';
    bubble.innerHTML  = renderMarkdown(text);

    const time = document.createElement('div');
    time.className   = 'msg-time';
    time.textContent = formatTime(timestamp || new Date());

    inner.appendChild(bubble);
    inner.appendChild(time);
    wrap.appendChild(avatar);
    wrap.appendChild(inner);
    return wrap;
  }

  function createTyping() {
    const wrap   = document.createElement('div');
    wrap.className = 'message bot typing-indicator';
    wrap.id        = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className   = 'msg-avatar';
    avatar.textContent = '🌿';
    avatar.setAttribute('aria-hidden', 'true');

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    bubble.setAttribute('aria-label', 'SerenityBot is typing');

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    return wrap;
  }

  return { setProfile, getResponse, createBubble, createTyping, formatTime };
})();
