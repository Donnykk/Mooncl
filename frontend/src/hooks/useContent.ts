import { useState } from "react";
import { usePost } from "./usePost";
import { useGet } from "./useGet";
import { Story } from "@/types/story";
import { axiosInstance } from "@/lib/axios";
import { useCurrentWallet } from "@mysten/dapp-kit";

interface ContentResponse {
    success: boolean;
    story: Story;
}

interface ReplyResponse {
    success: boolean;
    reply: any;
}

interface DailyStoriesResponse {
    success: boolean;
    dailyStories: Story[];
}

export function useContent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [likedStories, setLikedStories] = useState<Set<number>>(new Set());
    const { currentWallet } = useCurrentWallet();

    // Endpoints
    const { trigger: createStory } = usePost<ContentResponse>("/stories");
    const { trigger: updateStory } =
        usePost<ContentResponse>("/stories/update");
    const { trigger: sendWhiskey } = usePost<ContentResponse>("/whiskey/send");
    const { trigger: sendReply } = usePost<ReplyResponse>("/reply/story");
    const { trigger: markSaved } = usePost<ContentResponse>(
        "/stories/mark_saved",
    );
    const { data: storiesData, mutate: refreshStories } = useGet<DailyStoriesResponse>("/stories/daily");

    const handleFetchStories = async () => {
        try {
            if (!currentWallet) {
                return [];
            }
            setLoading(true);
            const newData = await refreshStories();
            console.log("Fetched data:", newData);

            if (newData?.success && Array.isArray(newData.dailyStories)) {
                console.log("Setting stories:", newData.dailyStories);
                setStories(newData.dailyStories);
                return newData.dailyStories;
            } else if (Array.isArray(newData)) {
                // 如果返回的直接是数组
                console.log("Setting raw stories:", newData);
                setStories(newData);
                return newData;
            }
            return [];
        } catch (err) {
            console.error("Error fetching stories:", err);
            setError("Failed to fetch stories");
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handlePublishStory = async (
        title: string,
        content: string,
        isPay: boolean = false,
    ) => {
        try {
            if (!currentWallet) {
                return { success: false, error: "Connect Wallet First!!!" };
            }

            setLoading(true);

            const result = await createStory({
                title,
                storyText: content,
                isPay,
            });

            if (result.success) {
                return { success: true, story: result.story };
            }
            return { success: false, error: "Failed to publish story" };
        } catch (err) {
            setError("Failed to publish story");
            return { success: false, error: "Failed to publish story" };
        } finally {
            setLoading(false);
        }
    };

    const handleSendWhiskey = async (storyId: number) => {
        if (likedStories.has(storyId)) return { success: false };

        try {
            const result = await sendWhiskey({ storyId: storyId.toString() });
            if (result.success) {
                setLikedStories(
                    (prev) => new Set(Array.from(prev).concat(storyId)),
                );
            }
            return result;
        } catch (err) {
            setError("Failed to send whiskey");
            return { success: false };
        }
    };

    const handleSendReply = async (storyId: number, replyText: string) => {
        try {
            const result = await sendReply({
                storyId: storyId.toString(),
                replyText,
            });

            if (result.success) {
                // Mark story as saved after successful reply
                await markSaved({ storyId });
            }
            return result;
        } catch (err) {
            setError("Failed to send reply");
            return { success: false };
        }
    };

    const handleGetStoryById = async (storyId: string) => {
        try {
            const response = await axiosInstance.get<ContentResponse>(`/stories/by_id/${storyId}`);
            if (response.data.success) {
                return response.data.story;
            }
            return null;
        } catch (err) {
            console.error("Failed to fetch story:", err);
            return null;
        }
    };

    return {
        loading,
        error,
        stories,
        setStories,
        likedStories,
        createStory: handlePublishStory,
        fetchStories: handleFetchStories,
        sendWhiskey: handleSendWhiskey,
        sendReply: handleSendReply,
        getStoryById: handleGetStoryById,
    };
}
