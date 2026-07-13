export type JoinFormValues = {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  clubId: string;
  bio: string;
};

const clean = (value: string) => value.trim();
const shown = (value: string) => value || "Not provided";

/**
 * Keep the current EmailJS template keys while also supplying conventional aliases.
 * `message` is a complete fallback for templates that render one combined field.
 */
export function buildJoinTemplateParams(values: JoinFormValues): Record<string, string> {
  const fullName = clean(values.fullName);
  const email = clean(values.email);
  const phone = clean(values.phone);
  const age = clean(values.age);
  const gender = clean(values.gender);
  const clubId = clean(values.clubId);
  const bio = clean(values.bio);

  const message = [
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${shown(phone)}`,
    `Age: ${shown(age)}`,
    `Gender: ${shown(gender)}`,
    `CricClubs Player ID: ${shown(clubId)}`,
    `Bio: ${shown(bio)}`,
  ].join("\n");

  return {
    full_name: fullName,
    name: fullName,
    from_name: fullName,
    email,
    reply_to: email,
    phone,
    mobile: phone,
    telephone: phone,
    telphone: phone,
    age,
    gender,
    club_id: clubId,
    bio,
    message,
  };
}
