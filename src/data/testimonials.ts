import { Testimonial } from '@/types';

export const testimonialsData: Testimonial[] = [
  {
    id: 'priya-sharma',
    clientName: 'Priya Sharma',
    eventType: 'Signature Bridal Mehndi',
    bangaloreArea: 'Sadashivanagar, Bangalore',
    quote:
      'Aayesha is hands down the finest mehndi artist in Bangalore! She captured our courtship story inside the jharokha elements of my bridal design, including tiny coffee cups symbolizing where we met in Indiranagar. The stain turned into a dark, rich maroon by my wedding morning. Her calmness and patience throughout the 6-hour sitting was unmatched.',
    rating: 5,
    weddingDate: 'December 2025',
    verifiedBride: true,
    featured: true,
  },
  {
    id: 'tanvi-deshmukh',
    clientName: 'Tanvi & Rahul Deshmukh',
    eventType: 'Bridal Henna & Sangeet Party',
    bangaloreArea: 'Whitefield, Bangalore',
    quote:
      'Booking Aayesha through WhatsApp was seamless from the first greeting. She gave clear prep instructions, arrived at our Whitefield villa right on time, and completely blew away my guests. The organic henna smelled divine and left no chemical irritation whatsoever. Highly, highly recommend her!',
    rating: 5,
    weddingDate: 'November 2025',
    verifiedBride: true,
    featured: true,
  },
  {
    id: 'ananya-iyer',
    clientName: 'Ananya Iyer',
    eventType: 'South Indian Wedding Bridal Feet & Hands',
    bangaloreArea: 'Jayanagar, Bangalore',
    quote:
      'The precision in her lotus mandalas and bridal payal patterns is otherworldly. My mother and grandmother could not stop praising the clean symmetry. Even after 10 days, the henna stain looked so elegant. Thank you Aayesha for making my wedding week feel so royal!',
    rating: 5,
    weddingDate: 'January 2026',
    verifiedBride: true,
    featured: true,
  },
  {
    id: 'meher-unissa',
    clientName: 'Meher Unissa',
    eventType: 'Nikah & Reception Arabic Henna',
    bangaloreArea: 'Koramangala, Bangalore',
    quote:
      'I wanted a modern Dubai-style Arabic design that was airy, bold, and contemporary. Aayesha understood the brief instantly. Her lines are so razor-sharp and fluid. She is truly a master artisan with organic henna.',
    rating: 5,
    weddingDate: 'February 2026',
    verifiedBride: true,
    featured: false,
  },
  {
    id: 'deepika-reddy',
    clientName: 'Deepika Reddy',
    eventType: 'Engagement Henna',
    bangaloreArea: 'HSR Layout, Bangalore',
    quote:
      'The best experience! Scheduling was done smoothly on WhatsApp, she shared lovely design lookbooks, and guided me on how to care for the stain with mustard oil and cloves smoke. The dark stain received so many compliments.',
    rating: 5,
    weddingDate: 'October 2025',
    verifiedBride: true,
    featured: false,
  },
];

export function getFeaturedTestimonials(): Testimonial[] {
  return testimonialsData.filter((t) => t.featured);
}
