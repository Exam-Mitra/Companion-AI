// Maps relationship type -> illustrated avatar image.
// Falls back to the initial-letter circle if no avatar is set (keeps old companions working).

export const AVATAR_BY_RELATIONSHIP = {
  'Close friend': '/avatars/friend.png',
  'Romantic partner': '/avatars/romantic.png',
  'Mentor': '/avatars/mentor.png',
  'Family': '/avatars/family.png',
};

export function getAvatarSrc(companion) {
  if (!companion) return null;
  if (companion.avatarId && AVATAR_BY_RELATIONSHIP[companion.avatarId]) {
    return AVATAR_BY_RELATIONSHIP[companion.avatarId];
  }
  return AVATAR_BY_RELATIONSHIP[companion.relationship] || null;
}
