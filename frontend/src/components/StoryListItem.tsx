import { Story, Reply } from '@/game/utils/ColyseusClient';
import { cn } from "@/lib/utils";
import { useCallback } from 'react';
import ColyseusClient from '@/game/utils/ColyseusClient';

interface StoryListItemProps {
  story: Story;
  isSelected: boolean;
  onSelect: (story: Story) => void;
  isMyStories: boolean;
  setRecipient: (address: string) => void;
}

export function StoryListItem({ 
  story, 
  isSelected, 
  onSelect,
  isMyStories,
  setRecipient 
}: StoryListItemProps) {
  const handleSelect = useCallback(async () => {
    console.log("Selected story:", story);
    onSelect(story);
    setRecipient(story.author_address);
    
    try {
      const replyData = await ColyseusClient.getRepliesForStory(story.id);
      console.log("Fetched replies:", replyData);
      
      if (isMyStories) {
      } else {
        const allReplies = Object.values(replyData).flat();
        const sortedReplies = allReplies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    } catch (error) {
      console.error("Failed to fetch replies:", error);
    }
  }, [story, onSelect, isMyStories, setRecipient]);

  return (
    <div
      key={story.id}
      className={cn(
        "cursor-pointer space-y-2 p-3 border",
        "transition-colors pixel-corners",
        isSelected 
          ? "bg-[#3A3A3F] border-[#4EEAFF]/50"
          : "bg-[#2A2A2F] border-[#4A4A4F]/50 hover:border-[#4EEAFF]/30"
      )}
      onClick={handleSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h4 className="font-medium leading-none text-[#4EEAFF]">
            {story.author_address.slice(0, 6)}...{story.author_address.slice(-4)}
          </h4>
          <p className="text-sm text-[#4EEAFF]/70">{story.title}</p>
        </div>
        <div className="text-xs text-[#4EEAFF]/50">
          {new Date(story.created_at).toLocaleString()}
        </div>
      </div>
      <p className="text-xs text-[#4EEAFF]/70 line-clamp-2">
        {story.story_content}
      </p>
    </div>
  );
}