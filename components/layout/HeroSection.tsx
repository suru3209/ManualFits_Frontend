import { Carousel_003 } from "../ui/skiper-ui/skiper49";

// Using the carousel component with custom images
const HeroSection = () => {
  const images = [
    {
      src: "https://plus.unsplash.com/premium_photo-1669688174622-0393f5c6baa2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Description 1",
    },
    {
      src: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Description 2",
    },
    {
      src: "https://images.unsplash.com/photo-1552168212-9ceb61083ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Description 3",
    },
    {
      src: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Description 4",
    },
    {
      src: "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Description 5",
    },
    {
      src: "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Description 6",
    },
    // ... more images
  ];

  return (
    <Carousel_003
      images={images}
      showPagination={true}
      showNavigation={true}
      loop={true}
      autoplay={true}
      spaceBetween={0}
    />
  );
};

export default HeroSection;
