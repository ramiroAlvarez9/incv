export default function TooManyRequestsMessage() {
  return (
    <p className="text-gray-300">
      You have made too many requests for this IP address. The limit will be
      reset in 24 hours.
    </p>
  );
}
