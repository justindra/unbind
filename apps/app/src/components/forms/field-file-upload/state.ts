import { useReducer } from 'react';

type BaseAction<TType extends string, TPayload extends any> = {
  type: TType;
  payload: TPayload;
};

type Actions =
  | BaseAction<'SET_DROP_DEPTH', number>
  | BaseAction<'SET_IN_DROP_ZONE', boolean>
  | BaseAction<'ADD_FILE_TO_LIST', File[]>;

type State = { dropDepth: number; inDropZone: boolean; fileList: File[] };

const reducer = (state: State, action: Actions): State => {
  switch (action.type) {
    case 'SET_DROP_DEPTH':
      return { ...state, dropDepth: action.payload };
    case 'SET_IN_DROP_ZONE':
      return { ...state, inDropZone: action.payload };
    case 'ADD_FILE_TO_LIST':
      return { ...state, fileList: state.fileList.concat(action.payload) };
    default:
      return state;
  }
};

export const useFileUpload = () => {
  const [data, dispatch] = useReducer(reducer, {
    dropDepth: 0,
    inDropZone: false,
    fileList: [],
  });

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    dispatch({ type: 'SET_IN_DROP_ZONE', payload: true });
  };
  const onDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'SET_DROP_DEPTH', payload: data.dropDepth + 1 });
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'SET_DROP_DEPTH', payload: data.dropDepth - 1 });
    if (data.dropDepth > 0) return;
    dispatch({ type: 'SET_IN_DROP_ZONE', payload: false });
  };
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let files = [...e.dataTransfer.files];

    if (files && files.length > 0) {
      const existingFiles = data.fileList.map((f) => f.name);
      files = files.filter((f) => !existingFiles.includes(f.name));

      dispatch({ type: 'ADD_FILE_TO_LIST', payload: files });
      e.dataTransfer.clearData();
      dispatch({ type: 'SET_DROP_DEPTH', payload: 0 });
      dispatch({ type: 'SET_IN_DROP_ZONE', payload: false });
    }
  };

  const addFileToList = (files: FileList | null) => {
    if (!files) return;
    const fileList = [...files];
    dispatch({ type: 'ADD_FILE_TO_LIST', payload: fileList });
  };

  return {
    data,
    dispatch,
    eventHandlers: {
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDrop,
    },
    addFileToList,
  };
};
