export const site = {
  name: 'Unmeta',
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ''),
  github: process.env.NEXT_PUBLIC_GITHUB_URL,
  contact: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
};
