/* ==========================================================================
   INSTAGRAM SLIDER — content shown on the Bookings page
   --------------------------------------------------------------------------
   This is a hand-picked set of images, NOT a live feed — nothing here
   updates automatically when Lolly posts. Each slide links out to her
   Instagram profile (or a specific post, if you add one — see "url" below).

   To edit: add/remove/reorder objects in the array. "image" must point to
   a file in /images. Optional "url" sends that slide to one specific post
   instead of the profile — grab it from the "..." > "Copy link" on any
   Instagram post.

   Want this to update itself automatically as Lolly posts, with zero
   editing here? See README.md "Making the Instagram slider live" for the
   quickest path (a free embed widget, ~5 minutes, no coding).
   ========================================================================== */

window.INSTAGRAM_POSTS = [
  { image: "images/hero-home.jpg", caption: "Lolly Jaye Hair" },
  { image: "images/card-shadowdays.jpg", caption: "Shadow Day essentials" },
  { image: "images/card-lookandlearn.jpg", caption: "Look & Learn in action" },
  { image: "images/card-onetoone.jpg", caption: "1:1 education" },
  { image: "images/card-private.jpg", caption: "Planning private classes" },
  { image: "images/about-quote.jpg", caption: "Behind the chair" }
];
