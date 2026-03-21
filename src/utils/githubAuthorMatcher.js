const NOREPLY_PATTERN = /(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i;

export const parseNoreplyUsername = (email) => {
  if (!email || typeof email !== "string") return null;
  const match = email.trim().match(NOREPLY_PATTERN);
  return match?.[1]?.toLowerCase() || null;
};

export const extractCommitAuthorMetadata = (commit) => {
  const authorLogin = commit?.author?.login || commit?.committer?.login || null;
  const authorEmail =
    commit?.commit?.author?.email ||
    commit?.commit?.committer?.email ||
    commit?.author?.email ||
    null;
  const authorName = commit?.commit?.author?.name || commit?.commit?.committer?.name || null;

  return {
    authorLogin,
    authorEmail,
    authorName,
  };
};

export const matchCommitAuthorToMember = (commit, members) => {
  const { authorLogin, authorEmail, authorName } = extractCommitAuthorMetadata(commit);
  const normalizedLogin = authorLogin?.toLowerCase();
  const normalizedEmail = authorEmail?.toLowerCase();

  if (normalizedLogin) {
    const byLogin = members.find((m) => m.user.github_username?.toLowerCase() === normalizedLogin);
    if (byLogin) {
      return {
        member: byLogin,
        match_status: "matched",
        match_reason: "github_username",
        metadata: { authorLogin, authorEmail, authorName },
      };
    }
  }

  if (normalizedEmail) {
    const byEmail = members.find((m) => m.user.email?.toLowerCase() === normalizedEmail);
    if (byEmail) {
      return {
        member: byEmail,
        match_status: "matched",
        match_reason: "email",
        metadata: { authorLogin, authorEmail, authorName },
      };
    }
  }

  const noreplyUsername = parseNoreplyUsername(normalizedEmail);
  if (noreplyUsername) {
    const byNoreply = members.find(
      (m) => m.user.github_username?.toLowerCase() === noreplyUsername,
    );
    if (byNoreply) {
      return {
        member: byNoreply,
        match_status: "matched",
        match_reason: "noreply_username",
        metadata: { authorLogin, authorEmail, authorName },
      };
    }
  }

  return {
    member: null,
    match_status: "unmatched",
    match_reason: "no_member_match",
    metadata: { authorLogin, authorEmail, authorName },
  };
};
