"use client";

import { AuthContext } from "@/app/AuthContext";
import React, { useContext, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Grid } from "react-loader-spinner";
import styles from "./page.module.css";
import BookingModal from "@/app/components/BookingForm/BookingModal";
import Popup from "@/app/components/BookingForm/Popup";
import Link from "next/link";

const RoomsPage = () => {
  const { hotelId } = useParams();
  const { currentUser } = useContext(AuthContext);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    startDate: "",
    endDate: "",
  });
  const [availabilityError, setAvailabilityError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState(""); // "success" or "error"


  useEffect(() => {
    const fetchRooms = async () => {
      if (!hotelId) return;

      try {
        const response = await fetch(`/api/getHotels/${hotelId}/rooms`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setRooms(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [hotelId]);

  const handleBookingSubmit = async () => {
    setAvailabilityError("");

    const newStartDate = new Date(bookingDetails.startDate);
    const newEndDate = new Date(bookingDetails.endDate);
    const currentDate = new Date();

    //  dates are not empty
    if (!bookingDetails.startDate || !bookingDetails.endDate) {
      setAvailabilityError("Invalid date: Start date and end date are required.");
      setPopupType("error");
      setPopupMessage(availabilityError);
      setShowPopup(true);
      return;
    }

    // dates are not in the past
    if (newStartDate < currentDate || newEndDate < currentDate) {
      setAvailabilityError("Invalid date: Start date and end date must be in the future.");
      setPopupType("error");
      setPopupMessage(availabilityError);
      setShowPopup(true);
      return;
    }

    // end date is after the start date
    if (newEndDate < newStartDate) {
      setAvailabilityError("Invalid date: End date must be after the start date.");
      setPopupType("error");
      setPopupMessage(availabilityError);
      setShowPopup(true);
      return;
    }

    // include userId in bookingDetails
    const bookingData = {
      ...bookingDetails,
      userId: currentUser.uid,
    };

    try {
      const response = await fetch(`/api/getHotels/${hotelId}/rooms/${selectedRoom}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const data = await response.json();
        setAvailabilityError(data.message);
        setPopupType("error");
        setPopupMessage(data.message);
        setShowPopup(true);
        return;
      }

      setPopupType("success");
      setPopupMessage("Room booked successfully!");
      setShowPopup(true);
      setSelectedRoom(null);
    } catch (error) {
      setAvailabilityError("Error booking room: " + error.message);
      setPopupType("error");
      setPopupMessage("Error booking room: " + error.message);
      setShowPopup(true);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 vw-100">
        <Grid
          visible={true}
          height="180"
          width="180"
          color="#dfa974"
          ariaLabel="grid-loading"
          radius="12.5"
          wrapperStyle={{}}
          wrapperClass="grid-wrapper"
        />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-5">
      <h1 className="text-center pt-5">Our Rooms</h1>
      <section className={styles.spad}>
        <div className={styles.roomsSection}>
          <div className="container">
            <div className="row">
              {rooms.map((room) => (
                <div className="col-lg-4 col-md-6" key={room.id}>
                  <div className={styles.roomitem}>
                    <img src={room.image} alt={room.Title} />
                    <div className={styles.ritext}>
                      <h4>{room.Title}</h4>
                      <h3>
                        {room.Price}$<span>/Pernight</span>
                      </h3>
                      <table>
                        <tbody>
                          <tr>
                            <td className={styles.ro}>Size:</td>
                            <td>{room.Size}</td>
                          </tr>
                          <tr>
                            <td className={styles.ro}>Capacity:</td>
                            <td>{room.Capacity}</td>
                          </tr>
                          <tr>
                            <td className={styles.ro}>Bed:</td>
                            <td>{room.Bed}</td>
                          </tr>
                          <tr>
                            <td className={styles.ro}>Services:</td>
                            <td>{room.Services}</td>
                          </tr>
                        </tbody>
                      </table>
                      <Link href='#'
                        onClick={() => setSelectedRoom(room.id)}
                        className={styles.primarybtn}>
                        Booking Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {selectedRoom && (
        <BookingModal
          bookingDetails={bookingDetails}
          setBookingDetails={setBookingDetails}
          onSubmit={handleBookingSubmit}
          onCancel={() => setSelectedRoom(null)}
        />
      )}

          {/* Render the Popup component */}
          {showPopup && (
        <Popup
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default RoomsPage;
