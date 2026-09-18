/**
 * English dictionary. Key structure must exactly mirror ja.ts (checked by tests/i18n.test.ts).
 * §16: "英語切替時に日本語を残さない。全UI文言を辞書化し、CIで欠落を検出"
 */
const en = {
  brand: {
    tagline: "Make every place more possible.",
    taglineEn: "Make every place more possible.",
    ctaRentCamera: "Rent a camera",
    ctaHostLocation: "Host Camly at your location",
  },
  common: {
    loading: "Loading…",
    error: "Something went wrong",
    back: "Back",
    next: "Next",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  pilot: {
    title: "Rent a camera",
    nameLabel: "Name",
    emailLabel: "Email",
    phoneLabel: "Phone number",
    stayReservationLabel: "Reservation name",
    consentNotice: "Please agree to the Terms, Care Plan terms, and Privacy Policy before continuing.",
    termsLink: "Terms of Service",
    careLink: "Camly Care terms",
    privacyLink: "Privacy Policy",
    depositNotice:
      "A temporary card authorization hold of ¥50,000 will be placed at checkout. Only the usage fee will be charged after a normal return.",
    submitButton: "Agree & proceed to payment",
  },
  rentalActive: {
    title: "In use",
    elapsedLabel: "Elapsed time",
    currentPriceLabel: "Estimated current price",
    nextPriceChangeLabel: "Next price change at",
    returnButton: "Return camera",
    unlockCodeLabel: "Key box PIN",
  },
  return: {
    title: "Return process",
    videoInstruction: "Record a 5-10 second continuous video (front → back → power on → lens out → screen on)",
    photoInstruction: "Take one photo showing the camera, accessories, and cable connection together",
    checklistTitle: "Return checklist",
    submitButton: "Submit return",
    pendingNotice: "Your return request has been received. We'll confirm shortly.",
  },
  survey: {
    title: "Quick survey (under 1 minute)",
    reasonLabel: "Reason / occasion for renting",
    satisfactionLabel: "Satisfaction",
    skipButton: "Skip",
  },
  admin: {
    dashboardTitle: "Admin",
    rentalsTitle: "Rentals",
    boxesTitle: "Locations & Boxes",
    damageCasesTitle: "Damage cases",
  },
} as const;

export default en;
