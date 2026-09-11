import React, { useEffect, useState } from "react";
import { categoryScore, categoryStatsFor, buildAnswerSummary } from "../../data/scoring.js";
import { useTimers } from "../../hooks/useTimers.js";
import { useQuizSounds } from "../../hooks/useQuizSounds.js";

import QuizAnimations from "./QuizAnimations.jsx";
import TopBar from "./TopBar.jsx";
import BackFab from "./BackFab.jsx";
import MobileTraitStrip from "./MobileTraitStrip.jsx";
import IntroVideo from "./IntroVideo.jsx";
import QuestionCard from "./QuestionCard.jsx";
import ResultsCard from "./ResultsCard.jsx";
import MicroToast from "./MicroToast.jsx";
import SideTimelinePanel from "./SideTimelinePanel.jsx";
import MascotBubble from "./MascotBubble.jsx";
import TraitPopup from "./TraitPopup.jsx";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Poppins:wght@400;500;600;700&display=swap";

export default function PersonalityQuiz({ appConfig, onCompleteTest }) {
  const { CATEGORY_INFO, FEEDBACK_BY_RANK, MASCOT_MESSAGES, TOAST_HOLD_MS, MASCOT_HOLD_MS } = appConfig || {};

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const total = questions.length;
  const [renderIndex, setRenderIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [translate, setTranslate] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [burstValue, setBurstValue] = useState(null);
  const [burstKey, setBurstKey] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [popup, setPopup] = useState(null);
  const [mascot, setMascot] = useState(null);

  // State to show a video before each category starts
  const [showCategoryVideo, setShowCategoryVideo] = useState(true);

  const { clearTimers, after } = useTimers();
  const { playSelectBeep, playCategoryChime, playMascotChime, playTapClick } = useQuizSounds();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        const STANDARD_LABELS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
        const ALL_ICONS = [
          "/images/icons/architechture.png", "/images/icons/balance.png", "/images/icons/bar-chart.png",
          "/images/icons/books.png", "/images/icons/brain.png", "/images/icons/briefcase.png",
          "/images/icons/butterfly.png", "/images/icons/chair.png", "/images/icons/chat.png",
          "/images/icons/check (1).png", "/images/icons/check.png", "/images/icons/color-palette.png",
          "/images/icons/confetti-ball.png", "/images/icons/confused.png", "/images/icons/construction-worker.png",
          "/images/icons/cool.png", "/images/icons/crown.png", "/images/icons/emoji.png",
          "/images/icons/energy.png", "/images/icons/face.png", "/images/icons/fire.png",
          "/images/icons/hammer.png", "/images/icons/happy-face.png", "/images/icons/leaves.png",
          "/images/icons/lightning-bolt.png", "/images/icons/like.png", "/images/icons/microphone.png",
          "/images/icons/moon.png", "/images/icons/nervous.png", "/images/icons/neutral.png",
          "/images/icons/no-entry.png", "/images/icons/padlock.png", "/images/icons/party-popper.png",
          "/images/icons/pin.png", "/images/icons/protest.png", "/images/icons/puzzle.png",
          "/images/icons/rainbow.png", "/images/icons/repository.png", "/images/icons/request.png",
          "/images/icons/rocket (1).png", "/images/icons/rocket.png", "/images/icons/sad-face.png",
          "/images/icons/sad.png", "/images/icons/satellite-dish.png", "/images/icons/schedule.png",
          "/images/icons/search.png", "/images/icons/shh.png", "/images/icons/shooting-star.png",
          "/images/icons/smile.png", "/images/icons/smiles.png", "/images/icons/smiling-face (1).png",
          "/images/icons/smiling-face (2).png", "/images/icons/smiling-face.png", "/images/icons/sparkle.png",
          "/images/icons/speak.png", "/images/icons/stars.png", "/images/icons/strength.png",
          "/images/icons/sun-shower.png", "/images/icons/take-note.png", "/images/icons/target.png",
          "/images/icons/team.png", "/images/icons/thinking (1).png", "/images/icons/thinking.png",
          "/images/icons/tractor.png", "/images/icons/trophy.png", "/images/icons/university.png",
          "/images/icons/unlock.png", "/images/icons/waving-hand.png"
        ];

        const mapped = data.questions.map((q, qIndex) => {
          const labelsToUse = q.answers && q.answers.length === 5 ? q.answers : STANDARD_LABELS;
          return {
            category: q.category,
            visual: q.emoji || CATEGORY_INFO?.[q.category]?.emoji || "/images/icons/target.png", // fallback to category emoji
            text: q.question,
            options: labelsToUse.map((label, i) => {
              const globalOptionIndex = qIndex * 5 + i;
              const iconUrl = (q.icons && q.icons[i]) ? q.icons[i] : ALL_ICONS[globalOptionIndex % ALL_ICONS.length];
              return {
                value: i + 1,
                label,
                emoji: iconUrl,
                color: "#22C55E"
              };
            })
          };
        });
        setQuestions(mapped);
        setLoadingQuestions(false);
      })
      .catch(err => {
        console.error("Failed to load questions", err);
        setLoadingQuestions(false);
      });
  }, []);

  const q = questions[renderIndex];
  const info = CATEGORY_INFO?.[q?.category] || {};
  const answeredCount = Object.keys(answers).length;
  const progress = done ? 100 : Math.round((answeredCount / total) * 100);
  const busy = !!feedback || !!popup || !!mascot;

  useEffect(() => {
    document.body.style.overflow = busy ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [busy]);

  if (loadingQuestions) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#CFEDED]">
        <div className="animate-spin w-8 h-8 border-4 border-[#09A3A3] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const categoryStats = categoryStatsFor(appConfig, questions, answers, q?.category, done);

  const slideTo = (newIndex, dir) => {
    setNoTransition(false);
    setTranslate(dir * -105);
    after(() => {
      setNoTransition(true);
      setRenderIndex(newIndex);
      setTranslate(dir * 105);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setNoTransition(false);
          setTranslate(0);
        });
      });
    }, 240);
  };

  // Show the feedback popup once the category's questions are finished
  const advanceAfterCategory = (justFinishedCategory) => {
    setPopup({ key: justFinishedCategory, phase: "enter" });
  };

  // After moving on from the feedback popup, show the intro video for the next category
  const continueFromPopup = (fromTap = false) => {
    if (fromTap) playTapClick();
    clearTimers();
    setPopup((p) => (p ? { ...p, phase: "exit" } : p));
    after(() => {
      setPopup(null);
      if (renderIndex < total - 1) {
        setRenderIndex((prev) => prev + 1);
        setShowCategoryVideo(true); // the new category's video will start
      } else {
        setDone(true);
        if (onCompleteTest) onCompleteTest();
        else window.location.hash = 'report';
      }
    }, 240);
  };

  const dismissMascot = () => {
    setMascot((m) => (m ? { ...m, phase: "exit" } : m));
    after(() => {
      setMascot(null);
      if (renderIndex < total - 1) slideTo(renderIndex + 1, 1);
      else {
        setDone(true);
        if (onCompleteTest) onCompleteTest();
        else window.location.hash = 'report';
      }
    }, 220);
  };

  // Select (and change) an answer
  const selectOption = (opt) => {
    if (busy) return;

    setAnswers((prev) => ({ ...prev, [renderIndex]: opt.value }));
    setBurstValue(opt.value);
    setBurstKey((k) => k + 1);

    const pool = FEEDBACK_BY_RANK?.[opt.value] || FEEDBACK_BY_RANK?.["3"] || ["Noted!"];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setFeedback({
      key: burstKey + 1,
      text: typeof pick === 'string' ? pick : pick.text,
      emoji: typeof pick === 'string' ? opt.emoji : pick.icon,
      color: opt.color,
      label: opt.label,
    });
    playSelectBeep(opt.value);
    clearTimers();

    const questionNumber = renderIndex + 1;
    const isLastOfCategory =
      renderIndex === total - 1 || questions[renderIndex + 1].category !== q.category;
    const hitsMascotMilestone = !isLastOfCategory && questionNumber % 3 === 0 && questionNumber < total;

    after(() => {
      setFeedback(null);
      setBurstValue(null);

      if (isLastOfCategory) {
        playCategoryChime();
        advanceAfterCategory(q.category);
        return;
      }
      if (hitsMascotMilestone) {
        playMascotChime();
        const msg = MASCOT_MESSAGES ? MASCOT_MESSAGES[Math.floor(Math.random() * MASCOT_MESSAGES.length)] : "Keep going!";
        setMascot({ phase: "enter", message: msg });
        after(() => dismissMascot(), MASCOT_HOLD_MS || 2600);
        return;
      }
      if (renderIndex < total - 1) slideTo(renderIndex + 1, 1);
      else {
        setDone(true);
        if (onCompleteTest) onCompleteTest();
        else window.location.hash = 'report';
      }
    }, TOAST_HOLD_MS);
  };

  // Back button: navigate from question to video, and from video to previous category
  const goBack = () => {
    if (busy) return;
    playTapClick();
    if (done) {
      setDone(false);
      return;
    }

    // If Back is pressed while on the video, go to the last question of the previous category
    if (showCategoryVideo) {
      if (renderIndex > 0) {
        setShowCategoryVideo(false);
        slideTo(renderIndex - 1, -1);
      }
      return;
    }

    // If this is the first question of the category, go back to that category's video
    const isFirstQuestionOfCategory =
      renderIndex === 0 || questions[renderIndex - 1].category !== q.category;

    if (isFirstQuestionOfCategory) {
      setShowCategoryVideo(true);
      return;
    }

    // Go back 1 question
    clearTimers();
    setFeedback(null);
    setBurstValue(null);
    slideTo(renderIndex - 1, -1);
  };

  const restart = () => {
    playTapClick();
    clearTimers();
    setAnswers({});
    setFeedback(null);
    setBurstValue(null);
    setPopup(null);
    setMascot(null);
    setDone(false);
    setNoTransition(true);
    setTranslate(0);
    setRenderIndex(0);
    setShowCategoryVideo(true);
  };

  const selected = answers[renderIndex];
  const popupInfo = popup ? CATEGORY_INFO[popup.key] : null;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start pb-8 selection:bg-[#CFEDED] selection:text-[#021c1b] transition-colors duration-500 ease-out"
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: done
          ? "radial-gradient(circle at 50% 0%, #CFEDED 0%, #FFFFFF 65%)"
          : "radial-gradient(circle at 50% 0%, #CFEDED 0%, #F8FAFC 55%, #FFFFFF 100%)",
      }}
    >
      <QuizAnimations />

      {/* TopBar Header */}
      <div className="w-full max-w-4xl flex justify-center px-4 sm:px-6 pt-3 pb-1">
        <TopBar progress={progress} />
      </div>

      {!done && <MobileTraitStrip categoryStats={categoryStats} />}

      {/* Main Container */}
      <main className="w-full max-w-4xl flex flex-col lg:flex-row gap-5 xl:gap-6 px-3 sm:px-6 items-stretch justify-center mt-1">
        {/* Category Intro Video OR Questions Card */}
        <div className={`w-full ${showCategoryVideo ? "max-w-2xl mx-auto" : "flex-1 max-w-lg"} flex flex-col justify-stretch`}>
          {done ? (
            (() => {
              if (onCompleteTest) onCompleteTest();
              else window.location.hash = 'report';
              return null;
            })()
          ) : showCategoryVideo ? (
            <IntroVideo
              src={info.videoSrc || "/RIASEC_Realistic_R_Career_Th.mp4"}
              category={q.category}
              onFinish={() => {
                playTapClick();
                setShowCategoryVideo(false);
              }}
            />
          ) : (
            <div className="w-full flex flex-col">
              <QuestionCard
                question={q}
                info={info}
                renderIndex={renderIndex}
                translate={translate}
                noTransition={noTransition}
                selected={selected}
                burstValue={burstValue}
                burstKey={burstKey}
                busy={busy}
                onSelect={selectOption}
              />

              {/* Back button placed at the bottom-left right below the card */}
              <div className="w-full mt-3 flex justify-start">
                <BackFab
                  canGoBack={(renderIndex > 0 || !showCategoryVideo || done) && !busy}
                  onBack={goBack}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side Timeline (shown while questions are in progress) */}
        {!showCategoryVideo && !done && (
          <SideTimelinePanel
            progress={progress}
            categoryStats={categoryStats}
            feedback={feedback}
            currentCategoryScore={categoryScore(questions, answers, q?.category)}
            currentCategoryEmoji={info.emoji}
            appConfig={appConfig}
            done={done}
          />
        )}
      </main>

      <MicroToast feedback={feedback} />

      <MascotBubble mascot={mascot} onDismiss={() => { playTapClick(); dismissMascot(); }} color={info.color} />

      <TraitPopup popup={popup} popupInfo={popupInfo} onContinue={continueFromPopup} />
    </div>
  );
}