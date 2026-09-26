import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from models import User, Flight, Booking
import server
import db as db_module


@pytest.fixture
def mcp_session(db_session, monkeypatch):
    """Patch SessionLocal so MCP tools use the test in-memory DB."""
    monkeypatch.setattr(db_module, "SessionLocal", lambda: db_session)
    monkeypatch.setattr(server, "SessionLocal", lambda: db_session)
    return db_session


class TestMCPListFlights:
    """Test MCP list_flights tool."""

    def test_list_flights_returns_empty_list(self, mcp_session):
        # Act
        result = server.list_flights()
        # Assert
        assert result == []

    def test_list_flights_returns_all_flights(self, mcp_session):
        # Arrange
        mcp_session.add(Flight(
            origin="Earth", destination="Mars",
            departure_time="2099-01-01T09:00:00Z", arrival_time="2099-01-01T17:00:00Z",
            price=1000000, seats_available=5
        ))
        mcp_session.commit()
        # Act
        result = server.list_flights()
        # Assert
        assert len(result) == 1
        assert result[0].origin == "Earth"


class TestMCPBookFlight:
    """Test MCP book_flight tool."""

    def _seed(self, db):
        user = User(name="Alice", email="alice@example.com")
        db.add(user)
        db.flush()
        flight = Flight(
            origin="Earth", destination="Mars",
            departure_time="2099-01-01T09:00:00Z", arrival_time="2099-01-01T17:00:00Z",
            price=1000000, seats_available=3
        )
        db.add(flight)
        db.commit()
        db.refresh(user)
        db.refresh(flight)
        return user, flight

    def test_book_flight_success(self, mcp_session):
        # Arrange
        user, flight = self._seed(mcp_session)
        user_id = user.user_id
        # Act
        result = server.book_flight(user_id, user.name, flight.flight_id)
        # Assert
        assert result.status == "booked"
        assert result.user_id == user_id

    def test_book_flight_raises_on_flight_not_found(self, mcp_session):
        # Arrange
        user = User(name="Alice", email="alice@example.com")
        mcp_session.add(user)
        mcp_session.commit()
        mcp_session.refresh(user)
        # Act / Assert
        with pytest.raises(Exception, match="does not exist"):
            server.book_flight(user.user_id, user.name, 999)

    def test_book_flight_raises_on_no_seats(self, mcp_session):
        # Arrange
        user = User(name="Alice", email="alice@example.com")
        mcp_session.add(user)
        flight = Flight(
            origin="Earth", destination="Mars",
            departure_time="2099-01-01T09:00:00Z", arrival_time="2099-01-01T17:00:00Z",
            price=1000000, seats_available=0
        )
        mcp_session.add(flight)
        mcp_session.commit()
        mcp_session.refresh(user)
        mcp_session.refresh(flight)
        # Act / Assert
        with pytest.raises(Exception, match="fully booked"):
            server.book_flight(user.user_id, user.name, flight.flight_id)


class TestMCPGetBookings:
    """Test MCP get_bookings tool."""

    def test_get_bookings_returns_empty_list(self, mcp_session):
        result = server.get_bookings(user_id=999)
        assert result == []

    def test_get_bookings_returns_user_bookings(self, mcp_session):
        # Arrange
        user = User(name="Alice", email="alice@example.com")
        mcp_session.add(user)
        flight = Flight(
            origin="Earth", destination="Mars",
            departure_time="2099-01-01T09:00:00Z", arrival_time="2099-01-01T17:00:00Z",
            price=1000000, seats_available=5
        )
        mcp_session.add(flight)
        mcp_session.commit()
        mcp_session.refresh(user)
        mcp_session.refresh(flight)
        mcp_session.add(Booking(
            user_id=user.user_id, flight_id=flight.flight_id,
            status="booked", booking_time="2099-01-01T10:00:00Z"
        ))
        mcp_session.commit()
        # Act
        result = server.get_bookings(user_id=user.user_id)
        # Assert
        assert len(result) == 1
        assert result[0].status == "booked"


class TestMCPCancelBooking:
    """Test MCP cancel_booking tool."""

    def test_cancel_booking_success(self, mcp_session):
        # Arrange
        user = User(name="Alice", email="alice@example.com")
        mcp_session.add(user)
        flight = Flight(
            origin="Earth", destination="Mars",
            departure_time="2099-01-01T09:00:00Z", arrival_time="2099-01-01T17:00:00Z",
            price=1000000, seats_available=2
        )
        mcp_session.add(flight)
        mcp_session.commit()
        mcp_session.refresh(user)
        mcp_session.refresh(flight)
        booking = Booking(
            user_id=user.user_id, flight_id=flight.flight_id,
            status="booked", booking_time="2099-01-01T10:00:00Z"
        )
        mcp_session.add(booking)
        mcp_session.commit()
        mcp_session.refresh(booking)
        # Act
        result = server.cancel_booking(booking.booking_id)
        # Assert
        assert result.status == "cancelled"

    def test_cancel_booking_raises_on_not_found(self, mcp_session):
        with pytest.raises(Exception, match="not found"):
            server.cancel_booking(999)

    def test_cancel_booking_raises_on_already_cancelled(self, mcp_session):
        # Arrange
        user = User(name="Alice", email="alice@example.com")
        mcp_session.add(user)
        flight = Flight(
            origin="Earth", destination="Mars",
            departure_time="2099-01-01T09:00:00Z", arrival_time="2099-01-01T17:00:00Z",
            price=1000000, seats_available=5
        )
        mcp_session.add(flight)
        mcp_session.commit()
        mcp_session.refresh(user)
        mcp_session.refresh(flight)
        booking = Booking(
            user_id=user.user_id, flight_id=flight.flight_id,
            status="cancelled", booking_time="2099-01-01T10:00:00Z"
        )
        mcp_session.add(booking)
        mcp_session.commit()
        mcp_session.refresh(booking)
        # Act / Assert
        with pytest.raises(Exception, match="already cancelled"):
            server.cancel_booking(booking.booking_id)


class TestMCPRegisterUser:
    """Test MCP register_user tool."""

    def test_register_user_success(self, mcp_session):
        result = server.register_user("Alice", "alice@example.com")
        assert result.name == "Alice"
        assert result.email == "alice@example.com"

    def test_register_user_raises_on_duplicate_email(self, mcp_session):
        server.register_user("Alice", "alice@example.com")
        with pytest.raises(Exception, match="already registered"):
            server.register_user("Alice2", "alice@example.com")


class TestMCPGetUserId:
    """Test MCP get_user_id tool."""

    def test_get_user_id_success(self, mcp_session):
        server.register_user("Alice", "alice@example.com")
        result = server.get_user_id("Alice", "alice@example.com")
        assert result.name == "Alice"
        assert result.email == "alice@example.com"

    def test_get_user_id_raises_on_not_found(self, mcp_session):
        with pytest.raises(Exception, match="not found"):
            server.get_user_id("Nobody", "nobody@example.com")
