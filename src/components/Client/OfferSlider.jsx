// import { Search } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";

export default function OfferSlider() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Carousel className="my-3">
        <CarouselContent>
          <CarouselItem>
            <img
              className="h-40 w-full rounded-2xl border border-orange-100/80 object-cover shadow-[0_10px_20px_rgba(249,115,22,0.16)] sm:h-44"
              src="https://cdn.grabon.in/gograbon/images/merchant/1610000375685.png"
              alt=""
            />
          </CarouselItem>
          <CarouselItem>
            <img
              className="h-40 w-full rounded-2xl border border-orange-100/80 object-cover shadow-[0_10px_20px_rgba(249,115,22,0.16)] sm:h-44"
              src="https://cdn.grabon.in/gograbon/images/web-images/uploads/1618575517942/food-coupons.jpg"
              alt=""
            />
          </CarouselItem>
          <CarouselItem>
            <img
              className="h-40 w-full rounded-2xl border border-orange-100/80 object-cover shadow-[0_10px_20px_rgba(249,115,22,0.16)] sm:h-44"
              src="https://images.examples.com/wp-content/uploads/2017/11/discount-voucher-1024x681.jpg"
              alt=""
            />
          </CarouselItem>
        </CarouselContent>
        {/* <CarouselPrevious />
        <CarouselNext /> */}
      </Carousel>
    </motion.div>
  );
}
