export function getSocialInfo(link: string) {
  if (!link) return null;
  const l = link.toLowerCase();
  
  if (l.includes("github.com")) return { name: "GitHub", logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg", username: link.split("github.com/")[1]?.split("/")[0] };
  if (l.includes("facebook.com")) return { name: "Facebook", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg", username: link.split("facebook.com/")[1]?.split("/")[0] };
  if (l.includes("instagram.com")) return { name: "Instagram", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg", username: link.split("instagram.com/")[1]?.split("/")[0] };
  if (l.includes("behance.net")) return { name: "Behance", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Behance_logo.svg", username: link.split("behance.net/")[1]?.split("/")[0] };
  if (l.includes("dribbble.com")) return { name: "Dribbble", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Dribbble_icon_-_2016.svg", username: link.split("dribbble.com/")[1]?.split("/")[0] };
  if (l.includes("youtube.com")) return { name: "YouTube", logo: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg", username: link.split("youtube.com/")[1]?.split("/")[0] || link.split("youtube.com/c/")[1]?.split("/")[0] || link.split("youtube.com/@")[1]?.split("/")[0] };
  if (l.includes("tiktok.com")) return { name: "TikTok", logo: "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg", username: link.split("tiktok.com/")[1]?.split("/")[0]?.replace("@", "") };
  if (l.includes("pinterest.com")) return { name: "Pinterest", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png", username: link.split("pinterest.com/")[1]?.split("/")[0] };
  if (l.includes("twitter.com") || l.includes("x.com")) return { name: "X", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg", username: link.split(/x\.com\/|twitter\.com\//)[1]?.split("/")[0] };
  if (l.includes("linkedin.com")) return { name: "LinkedIn", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png", username: link.split("linkedin.com/in/")[1]?.split("/")[0] };
  if (l.includes("stackoverflow.com")) return { name: "Stack Overflow", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Stack_Overflow_icon.svg", username: link.split("stackoverflow.com/users/")[1]?.split("/")[1] || link.split("stackoverflow.com/users/")[1]?.split("/")[0] };
  if (l.includes("reddit.com")) return { name: "Reddit", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Reddit_logo.svg", username: link.split("reddit.com/user/")[1]?.split("/")[0] };
  if (l.includes("threads.net")) return { name: "Threads", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cce/Threads_app_logo.svg", username: link.split("threads.net/")[1]?.split("/")[0]?.replace("@", "") };
  if (l.includes("discord.com") || l.includes("discord.gg")) return { name: "Discord", logo: "https://upload.wikimedia.org/wikipedia/en/9/98/Discord_logo_svg.svg", username: "Discord" };
  if (l.includes("dev.to")) return { name: "DEV Community", logo: "https://upload.wikimedia.org/wikipedia/commons/8/87/Dev.to_icon.svg", username: link.split("dev.to/")[1]?.split("/")[0] };

  // Fallback
  try {
    const url = new URL(link);
    return { name: url.hostname, logo: null, username: link };
  } catch (e) {
    return { name: "Website", logo: null, username: link };
  }
}
