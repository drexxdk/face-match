'use client';

import { useReducer, useCallback } from 'react';
import type { Person, GameSession } from '@/lib/schemas';

interface Question {
  person: Person;
  options: Person[];
}

interface GameState {
  gameSession: GameSession | null;
  joinRecordId: string | null;
  currentQuestion: number;
  questions: Question[];
  selectedAnswer: string | null;
  score: number;
  timeLeft: number;
  answered: boolean;
  lastAnswerCorrect: boolean | null;
}

type GameAction =
  | { type: 'SET_GAME_SESSION'; payload: GameSession }
  | { type: 'SET_JOIN_RECORD_ID'; payload: string }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_TIME_LEFT'; payload: number }
  | { type: 'DECREMENT_TIME' }
  | { type: 'SELECT_ANSWER'; payload: string | null }
  | { type: 'SUBMIT_ANSWER'; payload: { isCorrect: boolean } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESET_QUESTION_STATE'; payload: number }
  | { type: 'RESET_GAME' };

const initialState: GameState = {
  gameSession: null,
  joinRecordId: null,
  currentQuestion: 0,
  questions: [],
  selectedAnswer: null,
  score: 0,
  timeLeft: 30,
  answered: false,
  lastAnswerCorrect: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_SESSION':
      return {
        ...state,
        gameSession: action.payload,
        timeLeft: action.payload.time_limit_seconds || 30,
      };

    case 'SET_JOIN_RECORD_ID':
      return { ...state, joinRecordId: action.payload };

    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };

    case 'SET_TIME_LEFT':
      return { ...state, timeLeft: action.payload };

    case 'DECREMENT_TIME':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };

    case 'SELECT_ANSWER':
      return { ...state, selectedAnswer: action.payload };

    case 'SUBMIT_ANSWER':
      return {
        ...state,
        answered: true,
        lastAnswerCorrect: action.payload.isCorrect,
        score: action.payload.isCorrect ? state.score + 1 : state.score,
      };

    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestion: state.currentQuestion + 1,
        selectedAnswer: null,
        answered: false,
        lastAnswerCorrect: null,
        timeLeft: state.gameSession?.time_limit_seconds || 30,
      };

    case 'RESET_QUESTION_STATE':
      return {
        ...state,
        timeLeft: action.payload,
        selectedAnswer: null,
        answered: false,
      };

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setGameSession = useCallback((session: GameSession) => {
    dispatch({ type: 'SET_GAME_SESSION', payload: session });
  }, []);

  const setJoinRecordId = useCallback((id: string) => {
    dispatch({ type: 'SET_JOIN_RECORD_ID', payload: id });
  }, []);

  const setQuestions = useCallback((questions: Question[]) => {
    dispatch({ type: 'SET_QUESTIONS', payload: questions });
  }, []);

  const setTimeLeft = useCallback((time: number) => {
    dispatch({ type: 'SET_TIME_LEFT', payload: time });
  }, []);

  const decrementTime = useCallback(() => {
    dispatch({ type: 'DECREMENT_TIME' });
  }, []);

  const selectAnswer = useCallback((answerId: string | null) => {
    dispatch({ type: 'SELECT_ANSWER', payload: answerId });
  }, []);

  const submitAnswer = useCallback((isCorrect: boolean) => {
    dispatch({ type: 'SUBMIT_ANSWER', payload: { isCorrect } });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' });
  }, []);

  const resetQuestionState = useCallback((timeLimit: number) => {
    dispatch({ type: 'RESET_QUESTION_STATE', payload: timeLimit });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    actions: {
      setGameSession,
      setJoinRecordId,
      setQuestions,
      setTimeLeft,
      decrementTime,
      selectAnswer,
      submitAnswer,
      nextQuestion,
      resetQuestionState,
      resetGame,
    },
  };
}
