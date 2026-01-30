// front/src/components/MainSlider.jsx
import React from 'react';
import Slider from 'react-slick';
import { useNavigate } from 'react-router-dom';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './MainSlider.css';

function MainSlider({ videoUrl }) {
  const navigate = useNavigate();

  const settings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000, // 5초마다 전환
    fade: true,
    pauseOnHover: true,
    arrows: true,
  };

  return (
    <div className="main-slider-container">
      <Slider {...settings}>
        {/* 슬라이드 1: 광고 영상 */}
        <div className="slide">
          <div className="video-slide">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="slider-video"
            >
              <source src={videoUrl} type="video/mp4" />
              브라우저가 비디오를 지원하지 않습니다.
            </video>
            <div className="video-overlay">
              <button 
                className="cta-button"
                onClick={() => navigate('/products')}
              >
                지금 쇼핑하기
              </button>
            </div>
          </div>
        </div>

        {/* 슬라이드 2: 기존 KISETSU 배너 */}
        <div className="slide">
          <div className="intro-slide">
            <div className="snow-container">
              <div className="snowflake">❄</div>
              <div className="snowflake">❄</div>
              <div className="snowflake">❄</div>
              <div className="snowflake">❄</div>
              <div className="snowflake">❄</div>
              <div className="snowflake">❄</div>
            </div>
            <h1 className="main-title">KISETSU</h1>
            <p className="subtitle">❄ 겨울을 담다..</p>
            <button 
              className="shop-button"
              onClick={() => navigate('/products')}
            >
              전체상품
            </button>
          </div>
        </div>
      </Slider>
    </div>
  );
}

export default MainSlider;