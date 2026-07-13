import assert from "node:assert/strict";
import test from "node:test";

type JoinFormValues = {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  clubId: string;
  bio: string;
};

async function loadBuilder() {
  try {
    return (await import("./templateParams")).buildJoinTemplateParams as
      | ((values: JoinFormValues) => Record<string, string>)
      | undefined;
  } catch {
    return undefined;
  }
}

const values: JoinFormValues = {
  fullName: "Jordan Player",
  email: "jordan@example.com",
  phone: "312-555-0199",
  age: "24",
  gender: "Non-binary",
  clubId: "123456",
  bio: "Top-order batter and wicketkeeper.",
};

test("provides the phone number under common and legacy EmailJS keys", async () => {
  const buildJoinTemplateParams = await loadBuilder();
  if (!buildJoinTemplateParams) assert.fail("buildJoinTemplateParams is not implemented");

  const params = buildJoinTemplateParams(values);
  assert.equal(params.phone, values.phone);
  assert.equal(params.mobile, values.phone);
  assert.equal(params.telephone, values.phone);
  assert.equal(params.telphone, values.phone);
});

test("provides existing template keys and a complete readable message", async () => {
  const buildJoinTemplateParams = await loadBuilder();
  if (!buildJoinTemplateParams) assert.fail("buildJoinTemplateParams is not implemented");

  const params = buildJoinTemplateParams(values);
  assert.equal(params.full_name, values.fullName);
  assert.equal(params.email, values.email);
  assert.equal(params.reply_to, values.email);
  assert.equal(params.age, values.age);
  assert.equal(params.gender, values.gender);
  assert.equal(params.club_id, values.clubId);
  assert.equal(params.bio, values.bio);
  assert.match(params.message, /Phone: 312-555-0199/);
  assert.match(params.message, /CricClubs Player ID: 123456/);
  assert.match(params.message, /Bio: Top-order batter and wicketkeeper\./);
});
