"use client";

import { createContext, Dispatch, ReactNode, useContext, useMemo, useReducer } from "react";
import { createCatalogNumber, todayIso } from "@/lib/catalog";
import { validateUserMessage } from "@/lib/message-validation";
import { DoodleDensity, ImagePalette, RecordArtDirection, RecordMaterial, RecordRenderResult, StylePack } from "@/types/record";

interface CreationState {
  image: string;
  fileName: string;
  stylePack: StylePack;
  doodleDensity: DoodleDensity;
  material: RecordMaterial;
  userMessage: string;
  date: string;
  catalogNumber: string;
  imagePalette?: ImagePalette;
  result?: RecordRenderResult;
  messageValidation: { count: number; valid: boolean };
  choicesMade: { style: boolean; density: boolean; material: boolean };
}

type Action =
  | { type: "SET_IMAGE"; image: string; fileName: string }
  | { type: "SET_PALETTE"; imagePalette: ImagePalette }
  | { type: "SET_STYLE"; stylePack: StylePack }
  | { type: "SET_DENSITY"; doodleDensity: DoodleDensity }
  | { type: "SET_MATERIAL"; material: RecordMaterial }
  | { type: "SET_MESSAGE"; userMessage: string }
  | { type: "SET_RESULT"; result: RecordRenderResult }
  | { type: "RESET" };

function getInitialState(): CreationState {
  const date = todayIso();
  return {
    image: "",
    fileName: "",
    stylePack: "neon_scribble",
    doodleDensity: "medium",
    material: "classic",
    userMessage: "",
    date,
    catalogNumber: createCatalogNumber("neon_scribble"),
    messageValidation: { count: 0, valid: true },
    choicesMade: { style: false, density: false, material: false },
  };
}

function reducer(state: CreationState, action: Action): CreationState {
  switch (action.type) {
    case "SET_IMAGE": return { ...state, image: action.image, fileName: action.fileName };
    case "SET_PALETTE": return { ...state, imagePalette: action.imagePalette };
    case "SET_STYLE": return { ...state, stylePack: action.stylePack, catalogNumber: createCatalogNumber(action.stylePack), choicesMade: { ...state.choicesMade, style: true } };
    case "SET_DENSITY": return { ...state, doodleDensity: action.doodleDensity, choicesMade: { ...state.choicesMade, density: true } };
    case "SET_MATERIAL": return { ...state, material: action.material, choicesMade: { ...state.choicesMade, material: true } };
    case "SET_MESSAGE": {
      return { ...state, userMessage: action.userMessage, messageValidation: validateUserMessage(action.userMessage) };
    }
    case "SET_RESULT": return { ...state, result: action.result };
    case "RESET": return getInitialState();
  }
}

const CreationContext = createContext<{ state: CreationState; dispatch: Dispatch<Action>; artDirection: RecordArtDirection } | null>(null);

export function CreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const artDirection = useMemo<RecordArtDirection>(() => ({
    image: state.image,
    stylePack: state.stylePack,
    doodleDensity: state.doodleDensity,
    material: state.material,
    userMessage: state.userMessage.trim() || undefined,
    date: state.date,
    catalogNumber: state.catalogNumber,
    imagePalette: state.imagePalette,
  }), [state]);
  return <CreationContext.Provider value={{ state, dispatch, artDirection }}>{children}</CreationContext.Provider>;
}

export function useCreation() {
  const context = useContext(CreationContext);
  if (!context) throw new Error("useCreation must be used within CreationProvider");
  return context;
}
