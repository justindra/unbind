import { AuthUtils } from '@jfsi/react';
import { getQueryKey } from '@trpc/react-query';
import useWebSocket from 'react-use-websocket';
import { queryClient, trpc } from './trpc';
import { QueryKey } from '@tanstack/react-query';

function updateChat(queryKey: QueryKey, index: number, content: string) {
  queryClient.setQueryData(queryKey, (oldData: any) => {
    if (oldData.messages.length === index + 1) {
      return {
        ...oldData,
        messages: [
          ...oldData.messages.slice(0, index),
          {
            ...oldData.messages[index],
            content: oldData.messages[index].content + content,
          },
        ],
      };
    }
    return {
      ...oldData,
      messages: [
        ...oldData.messages,
        {
          content,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        },
      ],
    };
  });
}

export const useWSConnection = (documentId: string, chatId: string) => {
  const token = AuthUtils.getToken();
  const queryKey = getQueryKey(trpc.get_chat_by_id, chatId, 'query');
  const res = useWebSocket(import.meta.env.VITE_WS_ENDPOINT, {
    queryParams: {
      documentId: encodeURIComponent(documentId),
      chatId: encodeURIComponent(chatId),
    },
    protocols: token ?? '',
    onMessage: (e) => {
      const data = JSON.parse(e.data);
      if (data.action === 'chats.message.updated') {
        const { chatId: updatedChatId, index, content } = data.data;
        if (chatId === updatedChatId) {
          const indexInt = parseInt(index, 10);
          updateChat(queryKey, indexInt, content);
        }
        return;
      }
      if (data.action === 'chats.status.updated') {
        const { chatId: updatedChatId, status } = data.data;
        if (chatId === updatedChatId) {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            return {
              ...oldData,
              status,
            };
          });
        }
        return;
      }
    },
  });

  return res;
};
