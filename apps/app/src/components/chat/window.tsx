import React, { useEffect, useState } from 'react';
import { SendMessage } from './send-message';
import { queryClient, trpc } from '../../utils/trpc';
import { AuthUtils } from '@jfsi/react';
import { getQueryKey } from '@trpc/react-query';
import { MessageList } from './message-list';
import { useWSConnection } from '../../utils/websocket';

type ChatWindowProps = {
  chatId: string;
  documentId: string;
};

function updateChat(chatId: string, chatData: any) {
  const key = getQueryKey(trpc.get_chat_by_id, chatId, 'query');
  queryClient.setQueryData(key, chatData);
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  documentId,
}) => {
  const { data } = trpc.get_chat_by_id.useQuery(chatId, {
    // So that we don't refetch the chat constantly and it just gets it initially
    staleTime: Infinity,
  });
  const [loading, setLoading] = useState(false);

  const sendMessage = trpc.send_message.useMutation({
    onSuccess: (data) => {
      updateChat(chatId, data);
    },
  });

  useWSConnection(documentId, chatId);

  useEffect(() => {
    if (data && data.status) {
      setLoading(data.status !== 'idle');
    }
  }, [data?.status]);

  const handleSendMessage = (message: string) => {
    const user = AuthUtils.getUser();
    if (user) {
      setLoading(true);
      sendMessage.mutate({ chatId, message, actorId: user.userId });
    }
  };

  const handleAction = (action: string) => {
    if (action === 'summarize') {
      console.log('summarize');
      updateChat(chatId, {
        messages: [{ content: action }],
      });
    }
  };

  if (!data) return null;

  return (
    <div className='h-full flex flex-col'>
      <MessageList messages={data.messages} />
      <div className='border-b-2'></div>
      <SendMessage
        onSendMessage={handleSendMessage}
        onActions={handleAction}
        loading={loading}
      />
    </div>
  );
};
